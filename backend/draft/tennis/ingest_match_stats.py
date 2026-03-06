"""
BETIX — Tennis Match Stats Ingestion
Extracts per-player match statistics from the get_fixtures API response
and populates analytics.tennis_match_stats.

Stats are embedded in the fixtures response (no extra API calls needed).
Each match produces 2 rows: one per player.

Usage:
  python ingest_match_stats.py          # all weeks of current year
  python ingest_match_stats.py --test   # first 2 weeks only
"""
import sys, os, json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import httpx
from datetime import date, timedelta

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# ─── Stat name → DB column mapping ────────────────────────────
# For integer columns, we read stat_value directly
# For percentage columns, we strip "%" and convert to float
STAT_MAP = {
    "Aces":                    ("aces",                "int"),
    "Double Faults":           ("double_faults",       "int"),
    "1st serve percentage":    ("first_serve_pct",     "pct"),
    "1st serve points won":    ("first_serve_won_pct", "pct"),
    "2nd serve points won":    ("second_serve_won_pct","pct"),
    "Break Points Saved":      ("bp_saved_pct",        "pct"),
    "Break Points Converted":  ("bp_converted_pct",    "pct"),
    "Total Points Won":        ("total_points_won",    "won"),
    "Return Points Won":       ("return_won_pct",      "pct"),
    "Service games won":       ("service_games_held",  "won"),
    "Return games won":        ("return_games_won",    "won"),
}


def get_week_ranges(year: int) -> list[tuple[str, str]]:
    ranges = []
    current = date(year, 1, 1)
    year_end = date(year, 12, 31)
    while current <= year_end:
        end = min(current + timedelta(days=6), year_end)
        ranges.append((current.isoformat(), end.isoformat()))
        current = end + timedelta(days=1)
    return ranges


def fetch_fixtures(client: httpx.Client, api_key: str, base_url: str,
                   start: str, end: str) -> list[dict]:
    params = {
        "method": "get_fixtures",
        "APIkey": api_key,
        "date_start": start,
        "date_stop": end
    }
    try:
        resp = client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("success"):
            return data.get("result", [])
    except Exception as e:
        print(f"    ⚠️ API error {start}→{end}: {e}")
    return []


def parse_pct(val: str) -> float | None:
    """Parse '60%' → 60.0"""
    try:
        return float(val.replace("%", "").strip())
    except (ValueError, TypeError, AttributeError):
        return None


def parse_int(val) -> int | None:
    try:
        return int(str(val).replace("%", "").strip())
    except (ValueError, TypeError):
        return None


def extract_player_stats(statistics: list[dict], player_key: int) -> dict:
    """Extract match-level stats for a specific player from the statistics array."""
    # Initialize all columns to None so every row has identical keys
    ALL_COLS = [col for col, _ in STAT_MAP.values()]
    row = {col: None for col in ALL_COLS}

    for stat in statistics:
        if stat.get("player_key") != player_key:
            continue
        if stat.get("stat_period") != "match":
            continue

        name = stat.get("stat_name", "")
        if name not in STAT_MAP:
            continue

        col, kind = STAT_MAP[name]
        if kind == "int":
            row[col] = parse_int(stat.get("stat_value"))
        elif kind == "pct":
            row[col] = parse_pct(stat.get("stat_value"))
        elif kind == "won":
            row[col] = parse_int(stat.get("stat_won"))

    # Return row only if at least one stat was found
    if any(v is not None for v in row.values()):
        return row
    return {}


def main():
    test_mode = "--test" in sys.argv
    settings = get_settings()
    api_key = settings.API_TENNIS_KEY
    base_url = settings.API_TENNIS_BASE_URL
    year = date.today().year

    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    # 1. Load context: matches (api_id → internal id) and players (api_id → internal id)
    print("🎾 Loading matches & players from DB...")
    db_matches = db.select("tennis_matches", "id,api_id", {})
    db_players = db.select("players", "id,api_id", {})

    matches_map = {m["api_id"]: m["id"] for m in db_matches}
    players_map = {p["api_id"]: p["id"] for p in db_players}
    print(f"  ✅ {len(matches_map)} finished matches, {len(players_map)} players")

    # 2. Fetch fixtures week by week
    weeks = get_week_ranges(year)
    if test_mode:
        weeks = weeks[:2]
        print(f"\n🧪 TEST MODE: first 2 weeks of {year}")

    all_stats = []

    with httpx.Client(timeout=45.0) as api_client:
        for start, end in weeks:
            fixtures = fetch_fixtures(api_client, api_key, base_url, start, end)

            for fix in fixtures:
                event_key = int(fix.get("event_key", 0))
                if event_key not in matches_map:
                    continue

                stats_arr = fix.get("statistics", [])
                if not stats_arr:
                    continue

                match_id = matches_map[event_key]
                p1_api = int(fix.get("first_player_key", 0))
                p2_api = int(fix.get("second_player_key", 0))

                for p_api in [p1_api, p2_api]:
                    if p_api not in players_map:
                        continue

                    row = extract_player_stats(stats_arr, p_api)
                    if not row:
                        continue

                    row["match_id"] = match_id
                    row["player_id"] = players_map[p_api]
                    all_stats.append(row)

            kept = sum(1 for f in fixtures if int(f.get("event_key", 0)) in matches_map and f.get("statistics"))
            if kept > 0:
                print(f"  🔍 {start} → {end}: {kept} matches with stats")

    # 3. Upsert
    print(f"\n📤 Upserting {len(all_stats)} stat rows...")
    batch_size = 100
    inserted = 0

    for i in range(0, len(all_stats), batch_size):
        batch = all_stats[i:i + batch_size]
        try:
            db.upsert("tennis_match_stats", batch, on_conflict="match_id,player_id")
            inserted += len(batch)
            print(f"  ✅ Batch {i // batch_size + 1}: {len(batch)} rows")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1}: {e}")

    print(f"\n🏆 Done! {inserted}/{len(all_stats)} stat rows ingested.")

    # 4. Verification (test mode)
    if test_mode and inserted > 0:
        print("\n🔍 Verification — sample from DB:")
        sample = db.select("tennis_match_stats",
            "match_id,player_id,aces,double_faults,first_serve_pct,bp_saved_pct,total_points_won",
            {}, limit=3)
        for s in sample:
            print(f"  {json.dumps(s)}")


if __name__ == "__main__":
    main()
