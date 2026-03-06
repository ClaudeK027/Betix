
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def check_types():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    # Check one row from football_team_rolling
    res = db.select_raw("football_team_rolling", "limit=1")
    if res:
        form = res[0].get("l5_form")
        print(f"Football l5_form value: {form}")
        print(f"Football l5_form type: {type(form)}")

    # Check one row from basketball_team_rolling
    res_b = db.select_raw("basketball_team_rolling", "limit=1")
    if res_b:
        form_b = res_b[0].get("l5_form")
        print(f"Basketball l5_form value: {form_b}")
        print(f"Basketball l5_form type: {type(form_b)}")

if __name__ == "__main__":
    asyncio.run(check_types())
