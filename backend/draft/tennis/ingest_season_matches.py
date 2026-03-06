"""
BETIX — Tennis Matches Ingestion (Current Season)
Fetches all fixtures for the current year from api-tennis.com.
Only inserts matches where BOTH players and the tournament exist in the DB.

Usage:
  python ingest_season_matches.py          # all months
  python ingest_season_matches.py --test   # January only (1 API call)
"""
import sys, os, json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import httpx
from datetime import date


from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST


def get_week_ranges(year: int) -> list[tuple[str, str]]:
    """Returns (start_date, end_date) for each week of the year.
    Uses 7-day windows to avoid API 500 errors on large date ranges."""
    from datetime import timedelta
    ranges = []
    current = date(year, 1, 1)
    year_end = date(year, 12, 31)
    while current <= year_end:
        end = min(current + timedelta(days=6), year_end)
        ranges.append((current.isoformat(), end.isoformat()))
        current = end + timedelta(days=1)
    return ranges


def fetch_fixtures(client: httpx.Client, api_key: str, base_url: str,
                   start_date: str, end_date: str) -> list[dict]:
    """Fetch fixtures from api-tennis.com (synchronous)."""
    params = {
        "method": "get_fixtures",
        "APIkey": api_key,
        "date_start": start_date,
        "date_stop": end_date
    }
    try:
        resp = client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  ❌ API Error for {start_date} → {end_date}: {e}")
        return []

    if not data or not isinstance(data, dict) or not data.get("success"):
        return []
    return data.get("result", [])


def map_match(api_match: dict, p1_internal: int, p2_internal: int,
              tour_internal: int, surface: str | None) -> dict | None:
    """Map a fixture to analytics.tennis_matches schema."""

    # Date + Time
    d = api_match.get("event_date", "")
    t = api_match.get("event_time", "00:00")
    date_time = f"{d}T{t}:00Z" if d else None

    # Winner
    winner_raw = api_match.get("event_winner")
    winner_id = None
    if winner_raw == "First Player":
        winner_id = p1_internal
    elif winner_raw == "Second Player":
        winner_id = p2_internal

    # Status
    raw_status = api_match.get("event_status", "")
    if raw_status == "Finished":
        status = "finished"
    elif api_match.get("event_live") == "1":
        status = "live"
    elif raw_status in ("Cancelled", "Postponed"):
        return None  # skip — DB constraint rejects these
    elif winner_raw:
        # API sometimes returns empty status for finished matches
        status = "finished"
    else:
        return None  # skip unplayed matches

    # Score
    final_score = api_match.get("event_final_result", "")
    if final_score == "-":
        final_score = None

    # Sets
    scores = api_match.get("scores", [])
    sets_played = len(scores) if scores else None

    return {
        "api_id": int(api_match["event_key"]),
        "tournament_id": tour_internal,
        "round": api_match.get("tournament_round") or None,
        "date_time": date_time,
        "player1_id": p1_internal,
        "player2_id": p2_internal,
        "winner_id": winner_id,
        "score": final_score,
        "duration_minutes": None,
        "sets_played": sets_played,
        "status": status,
        "surface": surface,
        "indoor_outdoor": None,
        "venue": None,
    }


def main():
    test_mode = "--test" in sys.argv
    settings = get_settings()
    api_key = settings.API_TENNIS_KEY
    base_url = settings.API_TENNIS_BASE_URL
    year = date.today().year

    if not api_key:
        print("ERROR: API_TENNIS_KEY not set")
        return

    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    # 1. Load context
    print("🎾 Loading players & tournaments from DB...")
    db_players = db.select("players", "id,api_id", {})
    db_tournaments = db.select("tennis_tournaments", "id,api_id,surface", {})

    players_map = {p["api_id"]: p["id"] for p in db_players if p.get("api_id")}
    tournaments_map = {t["api_id"]: t["id"] for t in db_tournaments if t.get("api_id")}
    tournaments_surface = {t["api_id"]: t.get("surface") for t in db_tournaments if t.get("api_id")}

    print(f"  ✅ {len(players_map)} players, {len(tournaments_map)} tournaments loaded")

    # 2. Fetch fixtures
    week_ranges = get_week_ranges(year)
    if test_mode:
        week_ranges = week_ranges[:2]  # first 2 weeks only
        print(f"\n🧪 TEST MODE: first 2 weeks of {year} only")

    all_matches = []

    with httpx.Client(timeout=45.0) as api_client:
        for start_date, end_date in week_ranges:
            print(f"\n  🔍 Fetching: {start_date} → {end_date}...")
            results = fetch_fixtures(api_client, api_key, base_url, start_date, end_date)
            kept = 0

            for m in results:
                t_key = m.get("tournament_key")
                p1_key = m.get("first_player_key")
                p2_key = m.get("second_player_key")

                if not t_key or not p1_key or not p2_key:
                    continue

                t_api = int(t_key)
                p1_api = int(p1_key)
                p2_api = int(p2_key)

                if t_api in tournaments_map and p1_api in players_map and p2_api in players_map:
                    surface = tournaments_surface.get(t_api)
                    db_match = map_match(m,
                                         players_map[p1_api],
                                         players_map[p2_api],
                                         tournaments_map[t_api],
                                         surface)
                    if db_match:
                        all_matches.append(db_match)
                        kept += 1

            print(f"    ⭐ {kept} matches kept")

    # 3. Upsert
    print(f"\n📤 Upserting {len(all_matches)} matches...")
    batch_size = 100
    inserted = 0

    for i in range(0, len(all_matches), batch_size):
        batch = all_matches[i:i + batch_size]
        try:
            db.upsert("tennis_matches", batch, on_conflict="api_id")
            inserted += len(batch)
            print(f"  ✅ Batch {i // batch_size + 1}: {len(batch)} matches")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1}: {e}")

    print(f"\n🏆 Done! {inserted}/{len(all_matches)} matches ingested for {year}.")

    # 4. Verification (test mode only)
    if test_mode and inserted > 0:
        print("\n🔍 Verification — sample from DB:")
        sample = db.select("tennis_matches", "api_id,status,score,surface,round,sets_played", {}, limit=3)
        for s in sample:
            print(f"  {json.dumps(s)}")


if __name__ == "__main__":
    main()
