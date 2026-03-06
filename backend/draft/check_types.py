
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def check_columns():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    res = db.select_raw("football_team_rolling", "select=l5_form,l5_streak&limit=5&l5_form=not.is.null")
    print("Types for form and streak:")
    print(res)

if __name__ == "__main__":
    asyncio.run(check_columns())
