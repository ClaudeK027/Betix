import asyncio
import httpx
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd())))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

API_TENNIS_KEY = "31814aec50dbfd6e146c411f4841eb42dfab65b2650e153520df0dadfb03ed71"
API_TENNIS_BASE_URL = "https://api.api-tennis.com/tennis/"

async def fetch_match_data(match_id):
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    print(f"--- DATABASE (analytics.tennis_matches) for ID/API_ID {match_id} ---")
    # Try by id
    res_id = db.select("tennis_matches", "*", {"id": match_id})
    # Try by api_id
    res_api = db.select("tennis_matches", "*", {"api_id": match_id})
    
    if res_id:
        print("MATCH FOUND BY ID:")
        print(res_id[0])
    if res_api:
        print("MATCH FOUND BY API_ID:")
        print(res_api[0])
    if not res_id and not res_api:
        print("❌ Match not found in DB.")

    print(f"\n--- RAW API-TENNIS PAYLOAD (api_id {match_id}) ---")
    async with httpx.AsyncClient(base_url=API_TENNIS_BASE_URL) as client:
        params = {
            "method": "get_fixtures",
            "APIkey": API_TENNIS_KEY,
            "date_start": "2026-02-23",
            "date_stop": "2026-02-24"
        }
        resp = await client.get("", params=params)
        data = resp.json()
        results = data.get("result", [])
        match = next((m for m in results if str(m.get("event_key")) == str(match_id)), None)
        
        if match:
            import json
            # Remove bulky data for readability
            match.pop("pointbypoint", None)
            match.pop("statistics", None)
            print(json.dumps(match, indent=2))
        else:
            print(f"❌ Match {match_id} not found in API response for these dates.")






if __name__ == "__main__":
    m_id = "12104847"
    asyncio.run(fetch_match_data(m_id))
