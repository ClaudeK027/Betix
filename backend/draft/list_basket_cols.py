
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def check_columns():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    res = db.select_raw("basketball_match_stats", "limit=1")
    if res:
        print("Columns in basketball_match_stats:")
        print(sorted(res[0].keys()))

if __name__ == "__main__":
    asyncio.run(check_columns())
