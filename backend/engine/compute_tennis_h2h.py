"""
BETIX — compute_tennis_h2h.py
Fetches H2H (Head to Head) stats for each unique player pair found in tennis_matches.
Uses the api-tennis.com get_H2H endpoint.

Populates: analytics.tennis_h2h

Usage:
  python compute_tennis_h2h.py           # All pairs
  python compute_tennis_h2h.py --test    # First 3 pairs only
"""
import sys, os, json, time
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import httpx
from datetime import datetime

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST


def paginated_fetch(db, table, query):
    all_rows = []
    offset = 0
    while True:
        q = f"{query}&limit=1000&offset={offset}"
        rows = db.select_raw(table, q)
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000
    return all_rows


def fetch_h2h(client, api_key, base_url, p1_api_id, p2_api_id):
    """Fetch H2H from the API. Returns the H2H array (list of direct matches)."""
    params = {
        "method": "get_H2H",
        "APIkey": api_key,
        "first_player_key": str(p1_api_id),
        "second_player_key": str(p2_api_id),
    }
    try:
        resp = client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("success"):
            return data.get("result", {}).get("H2H", [])
    except Exception as e:
        print(f"    ⚠️ API error for {p1_api_id} vs {p2_api_id}: {e}")
    return []


def build_h2h_row(h2h_matches, p_a_internal, p_b_internal, p_a_api, p_b_api):
    """Build a tennis_h2h row from the list of H2H matches."""
    total_wins_a = 0
    total_wins_b = 0
    last_date = None
    last_winner = None
    last_score = None

    for m in h2h_matches:
        winner = m.get("event_winner")
        p1_api = int(m.get("first_player_key", 0))

        # Determine which internal player won
        if winner == "First Player":
            winner_api = p1_api
        elif winner == "Second Player":
            winner_api = int(m.get("second_player_key", 0))
        else:
            continue

        if winner_api == p_a_api:
            total_wins_a += 1
        elif winner_api == p_b_api:
            total_wins_b += 1

        # Track last meeting
        event_date = m.get("event_date")
        if event_date and (last_date is None or event_date > last_date):
            last_date = event_date
            last_winner = p_a_internal if winner_api == p_a_api else p_b_internal
            score = m.get("event_final_result", "")
            last_score = score if score != "-" else None

    return {
        "player_a_id": p_a_internal,
        "player_b_id": p_b_internal,
        "total_wins_a": total_wins_a,
        "total_wins_b": total_wins_b,
        "clay_wins_a": 0,
        "clay_wins_b": 0,
        "hard_wins_a": 0,
        "hard_wins_b": 0,
        "grass_wins_a": 0,
        "grass_wins_b": 0,
        "indoor_wins_a": 0,
        "indoor_wins_b": 0,
        "last_meeting_date": last_date,
        "last_winner_id": last_winner,
        "last_score": last_score,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }


def main():
    test_mode = "--test" in sys.argv
    settings = get_settings()
    api_key = settings.API_TENNIS_KEY
    base_url = settings.API_TENNIS_BASE_URL

    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    # 1. Load finished matches and players
    print("🎾 Loading matches & players...")
    matches = paginated_fetch(db, "tennis_matches",
        "select=player1_id,player2_id&status=eq.finished")
    players = db.select("players", "id,api_id", {})

    # Internal ID → API ID mapping
    id_to_api = {p["id"]: p["api_id"] for p in players}

    # 2. Extract unique pairs (sorted so A < B to avoid duplicates)
    pairs = set()
    for m in matches:
        p1 = m["player1_id"]
        p2 = m["player2_id"]
        if p1 in id_to_api and p2 in id_to_api:
            pair = (min(p1, p2), max(p1, p2))
            pairs.add(pair)

    pairs = list(pairs)
    print(f"  ✅ {len(pairs)} unique pairs found")

    if test_mode:
        pairs = pairs[:3]
        print(f"\n🧪 TEST MODE: 3 pairs only")

    # 3. Fetch H2H for each pair
    rows = []
    errors = 0
    t0 = time.time()

    with httpx.Client(timeout=15.0) as client:
        for i, (p_a, p_b) in enumerate(pairs):
            api_a = id_to_api[p_a]
            api_b = id_to_api[p_b]

            h2h = fetch_h2h(client, api_key, base_url, api_a, api_b)

            if h2h:
                row = build_h2h_row(h2h, p_a, p_b, api_a, api_b)
                rows.append(row)
            else:
                # No H2H data — still insert a row with 0 wins
                rows.append({
                    "player_a_id": p_a,
                    "player_b_id": p_b,
                    "total_wins_a": 0, "total_wins_b": 0,
                    "clay_wins_a": 0, "clay_wins_b": 0,
                    "hard_wins_a": 0, "hard_wins_b": 0,
                    "grass_wins_a": 0, "grass_wins_b": 0,
                    "indoor_wins_a": 0, "indoor_wins_b": 0,
                    "last_meeting_date": None,
                    "last_winner_id": None,
                    "last_score": None,
                    "updated_at": datetime.utcnow().isoformat() + "Z",
                })

            if (i + 1) % 25 == 0:
                print(f"  ✅ {i + 1}/{len(pairs)} pairs processed")

    if len(pairs) % 25 != 0:
        print(f"  ✅ {len(pairs)}/{len(pairs)} pairs processed")

    # 4. Upsert
    print(f"\n📤 Upserting {len(rows)} H2H rows...")
    batch_size = 100
    inserted = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            db.upsert("tennis_h2h", batch, on_conflict="player_a_id,player_b_id")
            inserted += len(batch)
            print(f"  ✅ Batch {i // batch_size + 1}: {len(batch)} rows")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1}: {e}")

    elapsed = time.time() - t0
    print(f"\n🏆 Done! {inserted}/{len(rows)} H2H rows in {elapsed:.1f}s")

    # 5. Verification
    if test_mode and inserted > 0:
        print("\n🔍 Verification — sample from DB:")
        sample = db.select("tennis_h2h",
            "player_a_id,player_b_id,total_wins_a,total_wins_b,last_meeting_date,last_score",
            {}, limit=3)
        for s in sample:
            print(f"  {json.dumps(s)}")


if __name__ == "__main__":
    main()
