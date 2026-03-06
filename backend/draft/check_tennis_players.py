import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.base_client import SupabaseREST
from app.config import get_settings

async def main():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    # Check match 12104931
    match_rows = db.select("tennis_matches", "id,api_id,player1_id,player2_id", {"api_id": 12104931})
    print(f"Match 12104931: {match_rows}")
    
    if match_rows:
        p1_id = match_rows[0].get("player1_id")
        p2_id = match_rows[0].get("player2_id")
        
        # Check players
        players = db.select("players", "id,api_id,name", {"id": f"in.({p1_id},{p2_id})"})
        print(f"Players: {players}")
        
    # Also check if api_ids 95770, 90887 exist
    print("Checking api=95770, 90887")
    missing = db.select("players", "id,api_id,name", {"api_id": "in.(95770,90887)"})
    print(missing)

if __name__ == "__main__":
    asyncio.run(main())
