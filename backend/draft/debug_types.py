
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def diagnose():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    # 1. Check a match from football_matches
    print("--- Football Matches ---")
    matches = db.select_raw("football_matches", "limit=1")
    if matches:
        m = matches[0]
        print(f"Match api_id: {m.get('api_id')} (Type: {type(m.get('api_id'))})")
        print(f"Match internal id: {m.get('id')} (Type: {type(m.get('id'))})")
        
        match_api_id = m.get('api_id')
        
        # 2. Check stats for this match
        print("\n--- Football Match Stats ---")
        stats = db.select("football_match_stats", "*", filters={"match_id": match_api_id}, limit=1)
        if stats:
            s = stats[0]
            print(f"Stats match_id: {s.get('match_id')} (Type: {type(s.get('match_id'))})")
            print(f"Stats team_id: {s.get('team_id')} (Type: {type(s.get('team_id'))})")
        else:
            print("No stats found for this match api_id.")
    else:
        print("No matches found.")

if __name__ == "__main__":
    asyncio.run(diagnose())
