import asyncio
import os
import sys
import json
import httpx

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd())))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def audit_match(match_id):
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    print(f"--- AUDIT FOR MATCH {match_id} ---")
    
    # 1. DB State
    rows = db.select("tennis_matches", "*", {"api_id": match_id})
    if rows:
        print("\n[DB STATE]")
        print(json.dumps(rows[0], indent=2))
    else:
        print("\n[DB STATE] No match found in DB.")
        
    # 2. API State (Search Mode)
    api_key = settings.API_TENNIS_KEY
    db_date_str = rows[0]["date_time"][:10] if rows else "2026-02-24"
    from datetime import datetime, timedelta
    base_date = datetime.strptime(db_date_str, "%Y-%m-%d")
    
    match_data = None
    found_date = None
    
    async with httpx.AsyncClient() as client:
        for i in range(-2, 5): # Search from 2 days before to 4 days after DB date
            target_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            url = f"https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey={api_key}&event_key={match_id}&date_start={target_date}&date_stop={target_date}"
            
            resp = await client.get(url)
            results = resp.json().get("result", [])
            if results:
                match_data = next((m for m in results if str(m.get("event_key")) == str(match_id)), None)
                if match_data:
                    found_date = target_date
                    break
                    
        if match_data:
            print(f"\n[API STATE - RAW for {match_id} Found on {found_date}]")
            raw_status = match_data.get("event_status")
            print(f"Raw Status from API: '{raw_status}'")
            
            # Remove bulky stats for clarity
            match_data.pop("pointbypoint", None)
            match_data.pop("statistics", None)
            print(json.dumps(match_data, indent=2))
        else:
            print(f"\n[API STATE] Match {match_id} NOT FOUND in the surrounding 7 days.")

if __name__ == "__main__":
    asyncio.run(audit_match("12104830"))
