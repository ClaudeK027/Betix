"""
BETIX — fetch_all_matches.py
Script d'extraction de TOUS les matchs de la saison (passés + futurs)
pour le Football et le Basketball.

Fonctionnement :
  1. Charge les mappings team_id et league_id depuis la BDD
  2. Pour chaque ligue, appelle l'API pour récupérer TOUS les matchs de la saison
  3. Vérifie si chaque match existe déjà (via api_id)
  4. INSERT ou UPDATE selon le cas

Usage :
  python fetch_all_matches.py                   # Toutes les ligues
  python fetch_all_matches.py --test            # PL + NBA uniquement
  python fetch_all_matches.py --football-only   # Football uniquement
  python fetch_all_matches.py --basketball-only # Basketball uniquement
  python fetch_all_matches.py --dry-run         # Affiche sans insérer
"""

import argparse
import asyncio
import logging
import os
import time
from dotenv import load_dotenv

load_dotenv()

import httpx
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST
from app.services.ingestion.constants import (
    CURRENT_SEASON,
    FOOTBALL_LEAGUES,
    FOOTBALL_STATUS_MAP,
    BASKETBALL_LEAGUES,
    BASKETBALL_STATUS_MAP,
)

logger = logging.getLogger("betix.fetch_all_matches")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")


class MatchFetcher:
    """Récupère tous les matchs de la saison depuis les APIs."""

    def __init__(self, dry_run: bool = False):
        settings = get_settings()
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        self.api_key = settings.API_SPORTS_KEY
        self.dry_run = dry_run

        # Caches
        self._team_id_map: dict[str, dict[int, int]] = {"football": {}, "basketball": {}}
        self._league_id_map: dict[str, dict[int, int]] = {"football": {}, "basketball": {}}

        # Existing api_ids in DB (for skip/update logic)
        self._existing_football: set[int] = set()
        self._existing_basketball: set[int] = set()

        self.report = {
            "football": {"leagues_processed": 0, "created": 0, "updated": 0, "skipped": 0, "errors": 0},
            "basketball": {"leagues_processed": 0, "created": 0, "updated": 0, "skipped": 0, "errors": 0},
            "api_requests": 0,
        }

    # =========================================================================
    # INIT
    # =========================================================================

    def _load_mappings(self):
        """Charge les mappings api_id -> internal_id pour teams et leagues."""
        for sport in ["football", "basketball"]:
            rows = self.db.select("teams", "id,api_id", {"sport": sport})
            self._team_id_map[sport] = {r["api_id"]: r["id"] for r in rows}
            logger.info(f"  [{sport}] {len(self._team_id_map[sport])} teams loaded")

        league_rows = self.db.select("leagues", "id,api_id")
        for r in league_rows:
            api_id = r["api_id"]
            internal_id = r["id"]
            # Map to both sports (leagues have unique api_ids)
            self._league_id_map["football"][api_id] = internal_id
            self._league_id_map["basketball"][api_id] = internal_id
        logger.info(f"  {len(league_rows)} leagues loaded")

    def _load_existing_ids(self):
        """Charge les api_id existants pour détecter les doublons."""
        fb_rows = self.db.select("football_matches", "api_id")
        self._existing_football = {r["api_id"] for r in fb_rows}
        logger.info(f"  {len(self._existing_football)} football matches already in DB")

        bb_rows = self.db.select("basketball_matches", "api_id")
        self._existing_basketball = {r["api_id"] for r in bb_rows}
        logger.info(f"  {len(self._existing_basketball)} basketball matches already in DB")

    # =========================================================================
    # API
    # =========================================================================

    async def _api_get(self, client: httpx.AsyncClient, base_url: str,
                       endpoint: str, params: dict) -> dict:
        """Appel GET à l'API avec headers."""
        url = f"https://{base_url}{endpoint}"
        headers = {"x-apisports-key": self.api_key}
        resp = await client.get(url, params=params, headers=headers)
        self.report["api_requests"] += 1
        resp.raise_for_status()
        return resp.json()

    # =========================================================================
    # FOOTBALL
    # =========================================================================

    def _transform_football(self, raw: dict) -> dict | None:
        """Transforme une fixture API en row football_matches."""
        fixture = raw.get("fixture", {})
        league = raw.get("league", {})
        teams = raw.get("teams", {})
        goals = raw.get("goals", {})

        api_id = fixture.get("id")
        if not api_id:
            return None

        home_api = teams.get("home", {}).get("id")
        away_api = teams.get("away", {}).get("id")
        league_api = league.get("id")

        home_id = self._team_id_map["football"].get(home_api)
        away_id = self._team_id_map["football"].get(away_api)
        league_id = self._league_id_map["football"].get(league_api)

        if not home_id or not away_id:
            return None  # Teams not in our DB

        api_status = fixture.get("status", {}).get("short", "NS")
        status = FOOTBALL_STATUS_MAP.get(api_status, "scheduled")

        return {
            "api_id": api_id,
            "league_id": league_id,
            "round": league.get("round", ""),
            "date_time": fixture.get("date"),
            "home_team_id": home_id,
            "away_team_id": away_id,
            "home_score": goals.get("home"),
            "away_score": goals.get("away"),
            "status": status,
            "referee_name": fixture.get("referee"),
            "stadium": fixture.get("venue", {}).get("name"),
            "weather": None,
        }

    async def process_football(self, client: httpx.AsyncClient, leagues: dict):
        """Récupère tous les matchs football de la saison."""
        logger.info("=" * 60)
        logger.info("  FOOTBALL — Extraction saison complète")
        logger.info("=" * 60)

        for league_api_id, league_meta in leagues.items():
            league_name = league_meta["name"]
            logger.info(f"\n  📋 {league_name} (API ID: {league_api_id})")

            try:
                data = await self._api_get(
                    client,
                    "v3.football.api-sports.io",
                    "/fixtures",
                    {"league": league_api_id, "season": CURRENT_SEASON},
                )
                fixtures = data.get("response", [])
                logger.info(f"     {len(fixtures)} fixtures retournées par l'API")

                rows_to_upsert = []
                for fix in fixtures:
                    row = self._transform_football(fix)
                    if row:
                        rows_to_upsert.append(row)

                if rows_to_upsert and not self.dry_run:
                    # Count created vs updated
                    new_ids = {r["api_id"] for r in rows_to_upsert}
                    created = len(new_ids - self._existing_football)
                    updated = len(new_ids & self._existing_football)

                    self.db.upsert("football_matches", rows_to_upsert, on_conflict="api_id")

                    # Update existing set
                    self._existing_football |= new_ids

                    self.report["football"]["created"] += created
                    self.report["football"]["updated"] += updated
                    logger.info(f"     ✅ {created} créés, {updated} mis à jour, {len(fixtures) - len(rows_to_upsert)} ignorés")
                elif self.dry_run:
                    logger.info(f"     [DRY-RUN] {len(rows_to_upsert)} matchs transformables")
                else:
                    logger.info("     ⚠️  Aucun match transformable")

                self.report["football"]["leagues_processed"] += 1

            except Exception as e:
                logger.error(f"     ❌ Erreur: {e}")
                self.report["football"]["errors"] += 1

            await asyncio.sleep(1.5)  # Rate limiting

    # =========================================================================
    # BASKETBALL
    # =========================================================================

    def _get_basketball_season(self, league_api_id: int) -> str:
        """Format de saison spécifique par ligue."""
        if league_api_id == 12:  # NBA
            return f"{CURRENT_SEASON}-{CURRENT_SEASON + 1}"
        return str(CURRENT_SEASON)

    def _transform_basketball(self, raw: dict) -> dict | None:
        """Transforme un game API en row basketball_matches."""
        game_id = raw.get("id")
        if not game_id:
            return None

        teams = raw.get("teams", {})
        scores = raw.get("scores", {})
        status_info = raw.get("status", {})
        league = raw.get("league", {})

        home_api = teams.get("home", {}).get("id")
        away_api = teams.get("away", {}).get("id")
        league_api = league.get("id")

        home_id = self._team_id_map["basketball"].get(home_api)
        away_id = self._team_id_map["basketball"].get(away_api)
        league_id = self._league_id_map["basketball"].get(league_api)

        if not home_id or not away_id:
            return None

        api_status = status_info.get("short", "NS")
        status = BASKETBALL_STATUS_MAP.get(api_status, "scheduled")

        home_scores = scores.get("home", {}) or {}
        away_scores = scores.get("away", {}) or {}

        def _quarter_score(key: str):
            h = home_scores.get(key)
            a = away_scores.get(key)
            if h is not None and a is not None:
                return {"home": h, "away": a}
            return None

        # Stadium / arena
        arena_name = None
        if raw.get("arena"):
            arena_name = raw["arena"].get("name") if isinstance(raw["arena"], dict) else None
        elif raw.get("venue"):
            arena_name = raw["venue"].get("name") if isinstance(raw["venue"], dict) else raw.get("venue")

        return {
            "api_id": game_id,
            "league_id": league_id,
            "date_time": raw.get("date"),
            "home_team_id": home_id,
            "away_team_id": away_id,
            "home_score": home_scores.get("total"),
            "away_score": away_scores.get("total"),
            "score_q1": _quarter_score("quarter_1"),
            "score_q2": _quarter_score("quarter_2"),
            "score_q3": _quarter_score("quarter_3"),
            "score_q4": _quarter_score("quarter_4"),
            "score_ot": _quarter_score("over_time"),
            "status": status,
            "stadium": arena_name,
        }

    async def process_basketball(self, client: httpx.AsyncClient, leagues: dict):
        """Récupère tous les matchs basketball de la saison."""
        logger.info("=" * 60)
        logger.info("  BASKETBALL — Extraction saison complète")
        logger.info("=" * 60)

        for league_api_id, league_meta in leagues.items():
            league_name = league_meta["name"]
            season_str = self._get_basketball_season(league_api_id)
            logger.info(f"\n  🏀 {league_name} (API ID: {league_api_id}, season: {season_str})")

            try:
                data = await self._api_get(
                    client,
                    "v1.basketball.api-sports.io",
                    "/games",
                    {"league": league_api_id, "season": season_str},
                )
                games = data.get("response", [])
                logger.info(f"     {len(games)} games retournés par l'API")

                rows_to_upsert = []
                for game in games:
                    row = self._transform_basketball(game)
                    if row:
                        rows_to_upsert.append(row)

                if rows_to_upsert and not self.dry_run:
                    new_ids = {r["api_id"] for r in rows_to_upsert}
                    created = len(new_ids - self._existing_basketball)
                    updated = len(new_ids & self._existing_basketball)

                    self.db.upsert("basketball_matches", rows_to_upsert, on_conflict="api_id")

                    self._existing_basketball |= new_ids

                    self.report["basketball"]["created"] += created
                    self.report["basketball"]["updated"] += updated
                    logger.info(f"     ✅ {created} créés, {updated} mis à jour, {len(games) - len(rows_to_upsert)} ignorés")
                elif self.dry_run:
                    logger.info(f"     [DRY-RUN] {len(rows_to_upsert)} matchs transformables")
                else:
                    logger.info("     ⚠️  Aucun match transformable")

                self.report["basketball"]["leagues_processed"] += 1

            except Exception as e:
                logger.error(f"     ❌ Erreur: {e}")
                self.report["basketball"]["errors"] += 1

            await asyncio.sleep(1.5)

    # =========================================================================
    # MAIN
    # =========================================================================

    async def run(self, football: bool = True, basketball: bool = True, test: bool = False):
        """Lance l'extraction complète."""
        t0 = time.time()

        logger.info("🚀 FETCH ALL MATCHES — Démarrage")
        logger.info(f"   Mode: {'TEST' if test else 'COMPLET'} | Dry-run: {self.dry_run}")

        # 1. Load mappings
        logger.info("\n📦 Chargement des mappings...")
        self._load_mappings()
        self._load_existing_ids()

        # 2. Select leagues
        fb_leagues = FOOTBALL_LEAGUES
        bb_leagues = BASKETBALL_LEAGUES
        if test:
            fb_leagues = {39: FOOTBALL_LEAGUES[39]}  # PL only
            bb_leagues = {12: BASKETBALL_LEAGUES[12]}  # NBA only

        async with httpx.AsyncClient(timeout=30.0) as client:
            if football:
                await self.process_football(client, fb_leagues)
            if basketball:
                await self.process_basketball(client, bb_leagues)

        # 3. Report
        elapsed = time.time() - t0
        logger.info("\n" + "=" * 60)
        logger.info("  FETCH ALL MATCHES — RAPPORT FINAL")
        logger.info("=" * 60)

        if football:
            fb = self.report["football"]
            logger.info(f"  [FOOTBALL]")
            logger.info(f"    leagues_processed: {fb['leagues_processed']}")
            logger.info(f"    created: {fb['created']}")
            logger.info(f"    updated: {fb['updated']}")
            logger.info(f"    errors: {fb['errors']}")

        if basketball:
            bb = self.report["basketball"]
            logger.info(f"  [BASKETBALL]")
            logger.info(f"    leagues_processed: {bb['leagues_processed']}")
            logger.info(f"    created: {bb['created']}")
            logger.info(f"    updated: {bb['updated']}")
            logger.info(f"    errors: {bb['errors']}")

        logger.info(f"  [GLOBAL]")
        logger.info(f"    api_requests: {self.report['api_requests']}")
        logger.info("=" * 60)
        logger.info(f"Terminé en {elapsed:.1f}s")


def main():
    parser = argparse.ArgumentParser(description="BETIX — Fetch All Season Matches")
    parser.add_argument("--test", action="store_true", help="Test mode: PL + NBA only")
    parser.add_argument("--football-only", action="store_true", help="Football only")
    parser.add_argument("--basketball-only", action="store_true", help="Basketball only")
    parser.add_argument("--dry-run", action="store_true", help="No DB writes")
    args = parser.parse_args()

    fetcher = MatchFetcher(dry_run=args.dry_run)

    football = not args.basketball_only
    basketball = not args.football_only

    asyncio.run(fetcher.run(football=football, basketball=basketball, test=args.test))


if __name__ == "__main__":
    main()
