import asyncio
import os
import sys

sys.path.insert(0, r"d:\Kaizen D\AI_Dev\BETIX\backend")
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def check_missing_details():
    settings = get_settings()
    db_public = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="public")

    mismatched_ids = [12103047, 12101388, 12101654, 12100255, 12101664]
    ids_str = ",".join(map(str, mismatched_ids))
    matches = db_public.select_raw("matches", f"select=api_sport_id,created_at&api_sport_id=in.({ids_str})&sport=eq.tennis")
    
    for m in matches:
        print(f"ID: {m['api_sport_id']} | Created at: {m.get('created_at', 'Unknown')}")

if __name__ == "__main__":
    asyncio.run(check_missing_details())
