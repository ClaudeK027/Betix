"""
BETIX — fetch_match_stats.py
Récupère les statistiques de TOUS les matchs terminés
en se basant sur les api_id des tables football_matches / basketball_matches.

Logique :
  1. Lire les api_id des matchs finished depuis analytics.*_matches
  2. Lire les match_id déjà présents dans analytics.*_match_stats
  3. Pour chaque match manquant → appel API stats → insert

Usage :
  python fetch_match_stats.py                     # Tous les matchs finished
  python fetch_match_stats.py --test 10           # 10 matchs par sport
  python fetch_match_stats.py --football-only     # Football uniquement
  python fetch_match_stats.py --basketball-only   # Basketball uniquement
  python fetch_match_stats.py --dry-run           # Preview sans écriture
"""

import asyncio
import argparse
import logging
import time
from typing import Optional

import httpx
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

logger = logging.getLogger("betix.fetch_match_stats")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")


class MatchStatsFetcher:
    """
    Récupère les stats pour tous les matchs finished qui n'ont pas encore
    de données dans les tables *_match_stats.
    """

    def __init__(self, dry_run: bool = False, max_requests: int = 7000):
        settings = get_settings()
        self.api_key = settings.API_SPORTS_KEY
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        self.dry_run = dry_run
        self.max_requests = max_requests
        self.request_count = 0

        # team api_id -> internal id cache
        self._team_cache: dict[str, dict[int, int]] = {"football": {}, "basketball": {}}

        self.report = {
            "football": {"total_finished": 0, "already_done": 0, "fetched": 0, "inserted": 0, "no_stats": 0, "errors": 0},
            "basketball": {"total_finished": 0, "already_done": 0, "fetched": 0, "inserted": 0, "no_stats": 0, "errors": 0},
            "api_requests": 0,
        }

    # =========================================================================
    # INIT
    # =========================================================================

    def _load_team_cache(self):
        """Charge le mapping api_id -> internal_id pour les teams."""
        for sport in ["football", "basketball"]:
            rows = self.db.select("teams", "id,api_id", {"sport": sport})
            self._team_cache[sport] = {r["api_id"]: r["id"] for r in rows}
            logger.info(f"  [{sport}] {len(self._team_cache[sport])} teams cached")

    def _get_finished_match_ids(self, sport: str) -> list[int]:
        """Récupère les api_id de tous les matchs finished (avec pagination)."""
        table = "football_matches" if sport == "football" else "basketball_matches"
        all_ids = []
        offset = 0
        while True:
            query = f"select=api_id&status=eq.finished&limit=1000&offset={offset}"
            rows = self.db.select_raw(table, query)
            if not rows:
                break
            all_ids.extend([r["api_id"] for r in rows])
            if len(rows) < 1000:
                break
            offset += 1000
        return all_ids

    def _get_existing_stats_ids(self, sport: str) -> set[int]:
        """Récupère les match_id déjà présents dans les tables stats (avec pagination)."""
        table = "football_match_stats" if sport == "football" else "basketball_match_stats"
        all_ids = set()
        offset = 0
        while True:
            query = f"select=match_id&limit=1000&offset={offset}"
            rows = self.db.select_raw(table, query)
            if not rows:
                break
            for r in rows:
                all_ids.add(r["match_id"])
            if len(rows) < 1000:
                break
            offset += 1000
        return all_ids

    def _get_basketball_scores(self) -> dict[int, dict]:
        """Charge les scores des matchs basketball pour calcul ORTG/DRTG (avec pagination)."""
        all_scores = {}
        offset = 0
        while True:
            query = f"select=api_id,home_team_id,away_team_id,home_score,away_score&status=eq.finished&limit=1000&offset={offset}"
            rows = self.db.select_raw("basketball_matches", query)
            if not rows:
                break
            for r in rows:
                all_scores[r["api_id"]] = r
            if len(rows) < 1000:
                break
            offset += 1000
        return all_scores

    # =========================================================================
    # API
    # =========================================================================

    async def _api_get(self, client: httpx.AsyncClient, endpoint: str, params: dict) -> dict:
        """GET avec contrôle de quota."""
        if self.request_count >= self.max_requests:
            raise RuntimeError(f"Quota atteint : {self.request_count}/{self.max_requests}")

        resp = await client.get(endpoint, params=params)
        self.request_count += 1
        self.report["api_requests"] += 1
        resp.raise_for_status()
        data = resp.json()

        errors = data.get("errors")
        if errors and isinstance(errors, dict) and len(errors) > 0:
            logger.warning(f"API warning: {errors}")

        await asyncio.sleep(0.25)  # Rate limit
        return data

    # =========================================================================
    # FOOTBALL
    # =========================================================================

    async def process_football(self, limit: int | None = None):
        """Récupère les stats de tous les matchs football finished."""
        logger.info("=" * 60)
        logger.info("  FOOTBALL — Stats pour matchs finished")
        logger.info("=" * 60)

        # 1. Matchs finished
        finished_ids = self._get_finished_match_ids("football")
        self.report["football"]["total_finished"] = len(finished_ids)
        logger.info(f"  {len(finished_ids)} matchs finished dans la DB")

        # 2. Stats déjà en DB
        existing = self._get_existing_stats_ids("football")
        self.report["football"]["already_done"] = len(existing)
        logger.info(f"  {len(existing)} matchs déjà dans football_match_stats")

        # 3. Matchs manquants
        missing = [mid for mid in finished_ids if mid not in existing]
        logger.info(f"  ➡️  {len(missing)} matchs à traiter")

        if limit:
            missing = missing[:limit]
            logger.info(f"  (limité à {limit} en mode test)")

        if not missing:
            logger.info("  ✅ Rien à faire")
            return

        # 4. Fetch stats
        async with httpx.AsyncClient(
            base_url="https://v3.football.api-sports.io",
            headers={"x-apisports-key": self.api_key},
            timeout=30.0,
        ) as client:
            for i, match_api_id in enumerate(missing):
                if self.request_count >= self.max_requests:
                    logger.warning(f"Quota atteint à {i}/{len(missing)}")
                    break

                try:
                    stats_data = await self._api_get(client, "/fixtures/statistics", {"fixture": match_api_id})
                    stats_response = stats_data.get("response", [])
                    self.report["football"]["fetched"] += 1

                    if not stats_response:
                        self.report["football"]["no_stats"] += 1
                        continue

                    rows = []
                    for team_stats in stats_response:
                        team_api_id = team_stats.get("team", {}).get("id")
                        statistics = team_stats.get("statistics", [])

                        team_internal = self._team_cache["football"].get(team_api_id)
                        if not team_internal:
                            continue

                        stat_map = {s["type"]: s["value"] for s in statistics}

                        rows.append({
                            "match_id": match_api_id,
                            "team_id": team_internal,
                            "possession_pct": _parse_pct(stat_map.get("Ball Possession")),
                            "shots_on_goal": _parse_int(stat_map.get("Shots on Goal")),
                            "shots_total": _parse_int(stat_map.get("Total Shots")),
                            "passes_total": _parse_int(stat_map.get("Total passes")),
                            "passes_accurate": _parse_int(stat_map.get("Passes accurate")),
                            "fouls": _parse_int(stat_map.get("Fouls")),
                            "corners": _parse_int(stat_map.get("Corner Kicks")),
                            "yellow_cards": _parse_int(stat_map.get("Yellow Cards")) or 0,
                            "red_cards": _parse_int(stat_map.get("Red Cards")) or 0,
                            "expected_goals": _parse_float(stat_map.get("expected_goals")),
                        })

                    if rows and not self.dry_run:
                        self.db.upsert("football_match_stats", rows, on_conflict="match_id,team_id")
                        self.report["football"]["inserted"] += len(rows)

                except Exception as e:
                    logger.error(f"  ❌ Match {match_api_id}: {e}")
                    self.report["football"]["errors"] += 1

                if (i + 1) % 50 == 0:
                    logger.info(f"  Progress: {i+1}/{len(missing)} | API calls: {self.request_count}")

    # =========================================================================
    # BASKETBALL
    # =========================================================================

    async def process_basketball(self, limit: int | None = None):
        """Récupère les stats de tous les matchs basketball finished."""
        logger.info("=" * 60)
        logger.info("  BASKETBALL — Stats pour matchs finished")
        logger.info("=" * 60)

        # 1. Matchs finished
        finished_ids = self._get_finished_match_ids("basketball")
        self.report["basketball"]["total_finished"] = len(finished_ids)
        logger.info(f"  {len(finished_ids)} matchs finished dans la DB")

        # 2. Stats déjà en DB
        existing = self._get_existing_stats_ids("basketball")
        self.report["basketball"]["already_done"] = len(existing)
        logger.info(f"  {len(existing)} matchs déjà dans basketball_match_stats")

        # 3. Matchs manquants
        missing = [mid for mid in finished_ids if mid not in existing]
        logger.info(f"  ➡️  {len(missing)} matchs à traiter")

        if limit:
            missing = missing[:limit]
            logger.info(f"  (limité à {limit} en mode test)")

        if not missing:
            logger.info("  ✅ Rien à faire")
            return

        # 4. Charger scores pour ORTG/DRTG
        scores_map = self._get_basketball_scores()

        # 5. Fetch stats
        async with httpx.AsyncClient(
            base_url="https://v1.basketball.api-sports.io",
            headers={"x-apisports-key": self.api_key},
            timeout=30.0,
        ) as client:
            for i, match_api_id in enumerate(missing):
                if self.request_count >= self.max_requests:
                    logger.warning(f"Quota atteint à {i}/{len(missing)}")
                    break

                try:
                    stats_data = await self._api_get(client, "/games/statistics/teams", {"id": match_api_id})
                    stats_response = stats_data.get("response", [])
                    self.report["basketball"]["fetched"] += 1

                    if not stats_response:
                        self.report["basketball"]["no_stats"] += 1
                        continue

                    match_info = scores_map.get(match_api_id, {})

                    rows = []
                    for team_stats in stats_response:
                        team_api_id = team_stats.get("team", {}).get("id")

                        team_internal = self._team_cache["basketball"].get(team_api_id)
                        if not team_internal:
                            continue

                        fg = team_stats.get("field_goals", {}) or {}
                        tp = team_stats.get("threepoint_goals", {}) or {}
                        ft = team_stats.get("freethrows_goals", {}) or {}
                        reb = team_stats.get("rebounds", {}) or {}

                        fgm = _parse_int(fg.get("total"))
                        fga = _parse_int(fg.get("attempts"))
                        tpm = _parse_int(tp.get("total"))
                        tpa = _parse_int(tp.get("attempts"))
                        ftm = _parse_int(ft.get("total"))
                        fta = _parse_int(ft.get("attempts"))
                        off_reb = _parse_int(reb.get("offence"))
                        def_reb = _parse_int(reb.get("defense"))
                        assists = _parse_int(team_stats.get("assists"))
                        turnovers = _parse_int(team_stats.get("turnovers"))
                        steals = _parse_int(team_stats.get("steals"))
                        blocks = _parse_int(team_stats.get("blocks"))
                        fouls = _parse_int(team_stats.get("personal_fouls"))

                        # Advanced metrics
                        possessions = None
                        ortg = None
                        drtg = None
                        efg_pct = None
                        tov_pct = None
                        orb_pct = None
                        ftr = None

                        if fga and fga > 0:
                            off_r = off_reb or 0
                            def_r = def_reb or 0
                            tov = turnovers or 0
                            fta_v = fta or 0
                            misses = fga - (fgm or 0)
                            total_reb = off_r + def_r if (off_r + def_r) > 0 else 1
                            orb_rate = off_r / total_reb

                            possessions = round(fga + 0.4 * fta_v - 1.07 * orb_rate * misses + tov, 1)

                            if possessions > 0 and match_info:
                                # ORTG/DRTG from DB scores
                                home_team_id = match_info.get("home_team_id")
                                home_score = match_info.get("home_score") or 0
                                away_score = match_info.get("away_score") or 0

                                if team_internal == home_team_id:
                                    team_score, opp_score = home_score, away_score
                                else:
                                    team_score, opp_score = away_score, home_score

                                ortg = round(team_score / possessions * 100, 1)
                                drtg = round(opp_score / possessions * 100, 1)

                            efg_pct = round(((fgm or 0) + 0.5 * (tpm or 0)) / fga * 100, 1)

                            denom = fga + 0.44 * fta_v + tov
                            tov_pct = round(tov / denom * 100, 1) if denom > 0 else None

                            orb_pct = round(off_r / total_reb * 100, 1) if total_reb > 0 else None

                            ftr = round(fta_v / fga * 100, 1)

                        rows.append({
                            "match_id": match_api_id,
                            "team_id": team_internal,
                            "fga": fga, "fgm": fgm,
                            "tpa": tpa, "tpm": tpm,
                            "fta": fta, "ftm": ftm,
                            "off_rebounds": off_reb, "def_rebounds": def_reb,
                            "assists": assists, "turnovers": turnovers,
                            "steals": steals, "blocks": blocks, "fouls": fouls,
                            "possessions": possessions,
                            "ortg": ortg, "drtg": drtg,
                            "efg_pct": efg_pct, "tov_pct": tov_pct,
                            "orb_pct": orb_pct, "ftr": ftr,
                        })

                    if rows and not self.dry_run:
                        self.db.upsert("basketball_match_stats", rows, on_conflict="match_id,team_id")
                        self.report["basketball"]["inserted"] += len(rows)

                except Exception as e:
                    logger.error(f"  ❌ Game {match_api_id}: {e}")
                    self.report["basketball"]["errors"] += 1

                if (i + 1) % 50 == 0:
                    logger.info(f"  Progress: {i+1}/{len(missing)} | API calls: {self.request_count}")

    # =========================================================================
    # MAIN
    # =========================================================================

    async def run(self, football: bool = True, basketball: bool = True, limit: int | None = None):
        """Point d'entrée principal."""
        t0 = time.time()
        logger.info("🚀 FETCH MATCH STATS — Démarrage")
        logger.info(f"   Dry-run: {self.dry_run} | Limit: {limit or 'ALL'}")

        self._load_team_cache()

        if football:
            await self.process_football(limit)
        if basketball:
            await self.process_basketball(limit)

        self._print_report()
        elapsed = time.time() - t0
        logger.info(f"Terminé en {elapsed:.1f}s")

    def _print_report(self):
        logger.info("\n" + "=" * 60)
        logger.info("  FETCH MATCH STATS — RAPPORT FINAL")
        logger.info("=" * 60)
        for sport in ["football", "basketball"]:
            r = self.report[sport]
            logger.info(f"  [{sport.upper()}]")
            for k, v in r.items():
                logger.info(f"    {k}: {v}")
        logger.info(f"  [GLOBAL]")
        logger.info(f"    api_requests: {self.report['api_requests']}")
        logger.info("=" * 60)


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================
def _parse_pct(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.replace("%", "").strip()
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _parse_int(value) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_float(value) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# =============================================================================
# CLI
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="BETIX — Fetch Match Stats (Match-Driven)")
    parser.add_argument("--test", type=int, nargs="?", const=10, help="Mode test: N matchs par sport (default: 10)")
    parser.add_argument("--football-only", action="store_true", help="Football uniquement")
    parser.add_argument("--basketball-only", action="store_true", help="Basketball uniquement")
    parser.add_argument("--dry-run", action="store_true", help="Preview sans écriture")
    parser.add_argument("--max-requests", type=int, default=7000, help="Max API requests")
    args = parser.parse_args()

    fetcher = MatchStatsFetcher(dry_run=args.dry_run, max_requests=args.max_requests)

    football = not args.basketball_only
    basketball = not args.football_only
    limit = args.test

    asyncio.run(fetcher.run(football=football, basketball=basketball, limit=limit))


if __name__ == "__main__":
    main()
