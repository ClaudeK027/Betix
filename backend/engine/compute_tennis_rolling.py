"""
BETIX — compute_tennis_rolling.py
Calculates rolling statistics for each tennis player at each match date.
0 API calls — all computed from data already in DB (tennis_matches + tennis_match_stats).

Populates: analytics.tennis_player_rolling

Usage:
  python compute_tennis_rolling.py           # Full compute
  python compute_tennis_rolling.py --test    # First 5 players only
  python compute_tennis_rolling.py --dry-run # Preview without writing
"""
import sys, os, json, time, argparse, logging
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

logger = logging.getLogger("betix.tennis_rolling")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")

L5 = 5
L10 = 10


# ─── Helpers ──────────────────────────────────────────────────────────────────

def safe_mean(values, default=None):
    clean = [v for v in values if v is not None]
    return round(mean(clean), 1) if clean else default


def safe_pct(wins, total):
    return round(wins / total * 100, 1) if total > 0 else None


def paginated_fetch(db, table, query):
    """Fetch all rows with pagination (Supabase caps at 1000)."""
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


def parse_date(dt_str):
    """Parse ISO date string to datetime."""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


# ─── Main computation ────────────────────────────────────────────────────────

def compute_tennis_rolling(db, dry_run=False, test_mode=False):
    logger.info("=" * 60)
    logger.info("  TENNIS — Calcul Rolling L5/L10/Season")
    logger.info("=" * 60)

    # 1. Load matches (finished only, sorted by date)
    logger.info("  📦 Loading matches...")
    matches = paginated_fetch(db, "tennis_matches",
        "select=id,api_id,date_time,player1_id,player2_id,winner_id,sets_played,status"
        "&status=eq.finished&order=date_time.asc")
    logger.info(f"     {len(matches)} finished matches")

    # 2. Load match stats
    logger.info("  📦 Loading match stats...")
    stats_rows = paginated_fetch(db, "tennis_match_stats",
        "select=match_id,player_id,aces,double_faults,first_serve_pct,"
        "first_serve_won_pct,second_serve_won_pct,bp_saved_pct,"
        "bp_converted_pct,total_points_won,return_won_pct,"
        "service_games_held,return_games_won")
    logger.info(f"     {len(stats_rows)} stat rows")

    # Index stats by (match_id, player_id)
    stats_idx = {}
    for s in stats_rows:
        stats_idx[(s["match_id"], s["player_id"])] = s

    # 3. Build timeline per player
    player_matches = defaultdict(list)
    for m in matches:
        if m.get("winner_id") is None:
            continue
        p1 = m["player1_id"]
        p2 = m["player2_id"]
        record = {
            "match_id": m["id"],
            "date": m["date_time"][:10],
            "date_time": m["date_time"],
            "player1_id": p1,
            "player2_id": p2,
            "winner_id": m["winner_id"],
            "sets_played": m.get("sets_played") or 0,
        }
        player_matches[p1].append(record)
        player_matches[p2].append(record)

    all_players = list(player_matches.keys())
    if test_mode:
        all_players = all_players[:5]
        logger.info(f"  🧪 TEST MODE: {len(all_players)} players only")

    logger.info(f"  📊 {len(all_players)} players to process")

    # 4. Compute rolling for each player
    rows_to_insert = []

    for player_id in all_players:
        timeline = sorted(player_matches[player_id], key=lambda x: x["date_time"])

        for i in range(1, len(timeline) + 1):
            current = timeline[i - 1]
            match_date = current["date"]

            # Windows
            w5 = timeline[max(0, i - L5):i]
            w10 = timeline[max(0, i - L10):i]
            season = timeline[:i]

            # ── Win percentages ──
            def win_pct(window):
                wins = sum(1 for m in window if m["winner_id"] == player_id)
                return safe_pct(wins, len(window))

            l5_win = win_pct(w5)
            l10_win = win_pct(w10) if len(w10) >= L10 else win_pct(w10)
            season_win = win_pct(season)

            # ── L10 service & return stats (from tennis_match_stats) ──
            aces_list = []
            first_serve_pct_list = []
            first_serve_won_list = []
            bp_saved_list = []
            return_won_list = []
            bp_converted_list = []

            for m in w10:
                st = stats_idx.get((m["match_id"], player_id))
                if not st:
                    continue
                aces_list.append(st.get("aces"))
                first_serve_pct_list.append(st.get("first_serve_pct"))
                first_serve_won_list.append(st.get("first_serve_won_pct"))
                bp_saved_list.append(st.get("bp_saved_pct"))
                return_won_list.append(st.get("return_won_pct"))
                bp_converted_list.append(st.get("bp_converted_pct"))

            # ── Fatigue ──
            days_since = None
            if i >= 2:
                prev_dt = parse_date(timeline[i - 2]["date_time"])
                curr_dt = parse_date(current["date_time"])
                if prev_dt and curr_dt:
                    days_since = (curr_dt - prev_dt).days

            # Sets played in last 7 days
            curr_dt = parse_date(current["date_time"])
            sets_l7 = 0
            if curr_dt:
                for m in timeline[:i]:
                    m_dt = parse_date(m["date_time"])
                    if m_dt and 0 < (curr_dt - m_dt).days <= 7:
                        sets_l7 += m.get("sets_played") or 0

            # Fatigue score: higher = more fatigued
            # Formula: (sets_l7 / 15) * 50 + max(0, (3 - days_since)) * 16.7
            fatigue = 0.0
            if sets_l7 > 0:
                fatigue += min(sets_l7 / 15, 1.0) * 50
            if days_since is not None and days_since < 3:
                fatigue += (3 - days_since) * 16.7
            fatigue = round(min(fatigue, 100), 1)

            row = {
                "player_id": player_id,
                "surface": "all",
                "date": match_date,
                "l5_win_pct": l5_win,
                "l10_win_pct": l10_win,
                "season_win_pct": season_win,
                "l10_aces_avg": safe_mean(aces_list),
                "l10_first_serve_pct": safe_mean(first_serve_pct_list),
                "l10_first_serve_won": safe_mean(first_serve_won_list),
                "l10_bp_saved_pct": safe_mean(bp_saved_list),
                "l10_return_won_pct": safe_mean(return_won_list),
                "l10_bp_converted_pct": safe_mean(bp_converted_list),
                "days_since_last_match": int(days_since) if days_since is not None else None,
                "sets_played_l7": int(sets_l7),
                "minutes_played_l7": None,  # API doesn't provide duration
                "fatigue_score": int(fatigue),
            }
            rows_to_insert.append(row)

    # Dedup: same player + same date → keep last
    deduped = {}
    for row in rows_to_insert:
        key = (row["player_id"], row["surface"], row["date"])
        deduped[key] = row
    rows_to_insert = list(deduped.values())

    logger.info(f"  📝 {len(rows_to_insert)} rolling rows to insert (after dedup)")

    # 5. Upsert
    if not dry_run and rows_to_insert:
        batch_size = 500
        for i in range(0, len(rows_to_insert), batch_size):
            batch = rows_to_insert[i:i + batch_size]
            try:
                db.upsert("tennis_player_rolling", batch,
                           on_conflict="player_id,surface,date")
                if (i + batch_size) % 2000 == 0 or i + batch_size >= len(rows_to_insert):
                    logger.info(f"     Progress: {min(i + batch_size, len(rows_to_insert))}/{len(rows_to_insert)}")
            except Exception as e:
                logger.error(f"     ❌ Batch {i // batch_size + 1}: {e}")
        logger.info(f"  ✅ {len(rows_to_insert)} rows inserted")
    elif dry_run:
        logger.info(f"  [DRY RUN] {len(rows_to_insert)} rows would be inserted")
        if rows_to_insert:
            logger.info(f"  Sample: {json.dumps(rows_to_insert[0], indent=2)}")

    return len(rows_to_insert)


def main():
    parser = argparse.ArgumentParser(description="BETIX — Tennis Player Rolling Stats")
    parser.add_argument("--test", action="store_true", help="First 5 players only")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    t0 = time.time()
    total = compute_tennis_rolling(db, dry_run=args.dry_run, test_mode=args.test)
    elapsed = time.time() - t0
    logger.info(f"\n🏁 Done — {total} rolling rows in {elapsed:.1f}s")


if __name__ == "__main__":
    main()
