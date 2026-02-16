"""
BETIX — compute_referee_stats.py
Reconstruction historique des stats arbitres (Football seulement).
"""

import sys
import logging
import argparse
from collections import defaultdict
from datetime import datetime
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# Configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("betix.compute_ref")

def compute_referee_stats(db: SupabaseREST, dry_run=False):
    logger.info("🚩 Referee Stats Computation (FOOTBALL)...")
    
    # 1. Load ALL finished matches with referee info
    fields = "api_id,date_time,referee_name,league_id"
    query = f"select={fields}&status=eq.finished&referee_name=not.is.null"
    
    all_matches = []
    
    # Also need card/foul stats per match?
    # Schema says ref stats are: avg_yellow, avg_red, avg_fouls, avg_penalties.
    # Where are these? In `football_match_stats` aggregated per match?
    # Yes: table football_match_stats has yellow_cards, red_cards, fouls per TEAM.
    # So for one match, Match Total = Team A + Team B stats.
    
    # Strategy: 
    # 1. Get all match IDs with referees.
    # 2. Get all stats rows for these matches.
    # 3. Aggregate.
    
    # Step 1: Matches
    matches_map = {} # match_id -> {referee, date, season}
    
    offset = 0
    while True:
        rows = db.select_raw("football_matches", f"{query}&limit=1000&offset={offset}")
        if not rows: break
        for r in rows:
            matches_map[r["api_id"]] = { # careful: match_stats uses internal ID or api_id?
                                         # The schema says matching is via ID, but let's check.
                                         # Typically I use `api_id` as pivot if `id` is local.
                                         # Let's rely on `id` if I can get it.
                "referee": r.get("referee_name"),
                "date": r.get("date_time")
            }
        if len(rows) < 1000: break
        offset += 1000
    
    matches_by_api_id = {}
    offset = 0
    while True:
        rows = db.select_raw("football_matches", f"select=id,api_id,referee_name,date_time&status=eq.finished&referee_name=not.is.null&limit=1000&offset={offset}")
        if not rows: break
        for r in rows:
            matches_by_api_id[r["api_id"]] = {
                "referee": r["referee_name"],
                "date": r["date_time"]
            }
        if len(rows) < 1000: break
        offset += 1000
        
    logger.info(f"   Matches with referee: {len(matches_by_api_id)}")
    
    if not matches_by_api_id:
        logger.warning("   No matches found with referee data.")
        return

    # Step 2: Stats
    # We need to sum cards/fouls per match_id
    match_totals = defaultdict(lambda: {"yellow": 0, "red": 0, "fouls": 0, "pens": 0})
    
    # Fetch stats
    # football_match_stats: match_id, yellow_cards, red_cards, fouls... (penalties typically tracked? schema says avg_penalties, but stats table might not have it explicitly unless 'goals_penalty'?)
    # Schema check: `football_match_stats` has `yellow_cards`, `red_cards`, `fouls`. No `penalties`.
    # Penalty info usually in events, not global stats?
    # Or maybe it's missing. I will compute what I have.
    
    offset = 0
    while True:
        # We need to filter match_ids IN our list? Too big.
        # Just fetch all stats and filter in memory (heavy but robust for <100k rows)
        # OR fetch paginated and check if match_id exists in map.
        rows = db.select_raw("football_match_stats", f"select=match_id,yellow_cards,red_cards,fouls&limit=1000&offset={offset}")
        if not rows: break
        
        for r in rows:
            mid = r["match_id"] # This is API ID now
            if mid in matches_by_api_id:
                curr = match_totals[mid]
                curr["yellow"] += (r["yellow_cards"] or 0)
                curr["red"] += (r["red_cards"] or 0)
                curr["fouls"] += (r["fouls"] or 0)
                # No penalties column in stats -> 0
                
        if len(rows) < 1000: break
        offset += 1000
        
    # Step 3: Aggregate per Referee per Season
    ref_stats = defaultdict(lambda: {
        "matches": 0,
        "yellow": 0,
        "red": 0, 
        "fouls": 0
    })
    
    current_year = datetime.now().year
    
    for mid, stats in match_totals.items():
        meta = matches_by_api_id.get(mid)
        if not meta: continue
        
        ref = meta["referee"]
        # Determine season. E.g. Date 2024-08 -> Season 2025. Date 2024-05 -> Season 2024.
        # Simple heuristic: if month >= 7, season = year + 1. Else year.
        d = datetime.fromisoformat(meta["date"].replace("Z", "+00:00")) # usually ISO
        if d.month >= 7:
            season = d.year + 1
        else:
            season = d.year
            
        key = (ref, season)
        entry = ref_stats[key]
        entry["matches"] += 1
        entry["yellow"] += stats["yellow"]
        entry["red"] += stats["red"]
        entry["fouls"] += stats["fouls"]
        
    # 4. Insert
    rows_to_insert = []
    for (ref, season), data in ref_stats.items():
        n = data["matches"]
        if n == 0: continue
        
        rows_to_insert.append({
            "referee_name": ref,
            "season": season,
            "matches_officiated": n,
            "avg_yellow_cards": round(data["yellow"] / n, 2),
            "avg_red_cards": round(data["red"] / n, 2),
            "avg_fouls": round(data["fouls"] / n, 1),
            "avg_penalties": 0.0 # Not available in stats source
        })
        
    logger.info(f"   Computed stats for {len(rows_to_insert)} referee-seasons")
    
    if not dry_run and rows_to_insert:
        chunk_size = 1000
        for i in range(0, len(rows_to_insert), chunk_size):
            batch = rows_to_insert[i:i+chunk_size]
            db.upsert("football_referee_stats", batch, on_conflict="referee_name,season")
            logger.info(f"   Inserted batch {i}-{i+len(batch)}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    compute_referee_stats(db, args.dry_run)

if __name__ == "__main__":
    main()
