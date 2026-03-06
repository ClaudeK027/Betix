import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.base_client import SupabaseREST
from app.config import get_settings

async def main():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="public")
    
    rows = db.select_raw("matches", "limit=1")
    if rows:
        print("Column names in public.matches:")
        for key in rows[0].keys():
            print(f"- {key}")

if __name__ == "__main__":
    asyncio.run(main())
