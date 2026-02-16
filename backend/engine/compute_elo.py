"""
BETIX — compute_elo.py
Reconstruction historique des ratings ELO pour Football & Basketball.
"""

import sys
import logging
import argparse
from datetime import datetime, timedelta
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# Configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger("betix.compute_elo")

# --- PARAMETRES ELO ---
K_FACTOR_FOOTBALL = 30
K_FACTOR_BASKETBALL = 20
DEFAULT_ELO = 1500.0

def get_k_factor(sport, league_tier="major"):
    # Could be refined based on league tier or match importance
    if sport == "football":
        return K_FACTOR_FOOTBALL
    return K_FACTOR_BASKETBALL

def expected_score(rating_a, rating_b):
    """Calcule la probabilité de victoire de A face à B (0.0 à 1.0)"""
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

def update_elo(rating_a, rating_b, actual_score_a, k=30):
    """Retourne les nouveaux ratings (new_a, new_b)"""
    expected_a = expected_score(rating_a, rating_b)
    change = k * (actual_score_a - expected_a)
    return rating_a + change, rating_b - change

def compute_elo_for_sport(sport: str, db: SupabaseREST, dry_run=False):
    match_table = "football_matches" if sport == "football" else "basketball_matches"
    elo_table = "football_team_elo" if sport == "football" else "basketball_team_elo"
    
    logger.info(f"🏀 ELO Computation for {sport.upper()}...")

    # 1. Load ALL finished matches sorted by date
    # Using specific select to minimize load
    query = f"select=api_id,date_time,home_team_id,away_team_id,home_score,away_score,status&status=eq.finished&order=date_time.asc"
    
    all_matches = []
    offset = 0
    while True:
        rows = db.select_raw(match_table, f"{query}&limit=1000&offset={offset}")
        if not rows: break
        all_matches.extend(rows)
        if len(rows) < 1000: break
        offset += 1000
    
    logger.info(f"   Matches loaded: {len(all_matches)}")
    
    # 2. Initialize current ratings
    # Map: team_id -> current_elo (float)
    team_ratings = {}
    
    # Also track history to insert later
    # List of dicts
    elo_history = []
    
    for m in all_matches:
        home_id = m["home_team_id"]
        away_id = m["away_team_id"]
        
        # Init ratings if new
        if home_id not in team_ratings: team_ratings[home_id] = DEFAULT_ELO
        if away_id not in team_ratings: team_ratings[away_id] = DEFAULT_ELO
        
        curr_home = team_ratings[home_id]
        curr_away = team_ratings[away_id]
        
        # Determine actual outcome (1=Win, 0.5=Draw, 0=Loss)
        h_score = m["home_score"]
        a_score = m["away_score"]
        
        if h_score is None or a_score is None:
            continue # Should not happen with status=finished, but safety
            
        if h_score > a_score:
            actual_home = 1.0
        elif h_score == a_score:
            actual_home = 0.5
        else:
            actual_home = 0.0
            
        # Update
        k = get_k_factor(sport)
        new_home, new_away = update_elo(curr_home, curr_away, actual_home, k)
        
        # Store new ratings
        team_ratings[home_id] = new_home
        team_ratings[away_id] = new_away
        
        # Record history snapshot
        date_str = m["date_time"][:10] # YYYY-MM-DD
        
        elo_history.append({
            "team_id": home_id,
            "date": date_str,
            "elo_rating": round(new_home, 1),
            "elo_change_1m": round(new_home - curr_home, 1) # Approximation, ideal would be true 1m delta
        })
        elo_history.append({
            "team_id": away_id,
            "date": date_str,
            "elo_rating": round(new_away, 1),
            "elo_change_1m": round(new_away - curr_away, 1)
        })
        
    # 3. Batch Insert
    # Deduplicate: Keep LAST rating per day for a team
    deduped = {}
    for row in elo_history:
        key = (row["team_id"], row["date"])
        deduped[key] = row
    final_rows = list(deduped.values())
    
    logger.info(f"   Computed {len(final_rows)} ELO snapshots")
    
    if not dry_run:
        # Upsert in chunks
        chunk_size = 1000
        for i in range(0, len(final_rows), chunk_size):
            batch = final_rows[i:i+chunk_size]
            try:
                db.upsert(elo_table, batch, on_conflict="team_id,date")
                logger.info(f"   Inserted batch {i}-{i+len(batch)}")
            except Exception as e:
                logger.error(f"   Error inserting batch: {e}")
                # Try to continue?
                # For ELO, losing history is bad but we can retry.
                pass
    else:
        logger.info("   [DRY RUN] No DB changes.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sport", choices=["football", "basketball", "all"], default="all")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    sports = ["football", "basketball"] if args.sport == "all" else [args.sport]
    
    for s in sports:
        compute_elo_for_sport(s, db, args.dry_run)

if __name__ == "__main__":
    main()
