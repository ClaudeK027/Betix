import sys, os, asyncio, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST
import httpx

async def diag(match_api_id):
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    rows = db.select_raw("tennis_matches", f"select=id,date_time&api_id=eq.{match_api_id}")
    if not rows:
        print(f"Match {match_api_id} not found in DB")
        return
    
    match_date = rows[0]["date_time"][:10]
    print(f"Match Date: {match_date}")
    
    url = f"https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey={settings.API_TENNIS_KEY}&event_key={match_api_id}&date_start={match_date}&date_stop={match_date}"
    print(f"Querying: {url}")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print(f"Status: {resp.status_code}")
        data = resp.json()
        
    results = data.get("result", [])
    print(f"Found {len(results)} matches for the day")
    
    match_found = next((m for m in results if str(m.get("event_key")) == str(match_api_id)), None)
    
    if match_found:
        print(f"✅ Match {match_api_id} found in the list!")
        stats = match_found.get("statistics", [])
        print(f"Found {len(stats)} stat entries")
        if not stats:
            print("Statistics field is EMPTY for this match.")
    else:
        print(f"❌ Match {match_api_id} NOT found in the API list for {match_date}")
        if results:
            print("First 3 matches in list:")
            for m in results[:3]:
                print(f" - {m.get('event_key')}: {m.get('event_first_player')} vs {m.get('event_second_player')} ({m.get('event_time')})")

if __name__ == "__main__":
    asyncio.run(diag(12104664))
