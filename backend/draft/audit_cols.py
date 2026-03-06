
import asyncio
import json
import os
import sys

# Ajout du chemin pour les imports app
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd())))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def audit_columns():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema='analytics')
    
    tables = [
        'football_team_rolling',
        'basketball_team_rolling',
        'tennis_player_rolling'
    ]
    
    report = {}
    for table in tables:
        try:
            res = db.select(table, '*', limit=1)
            if res:
                report[table] = sorted(list(res[0].keys()))
            else:
                report[table] = "Table empty"
        except Exception as e:
            report[table] = f"Error: {str(e)}"
            
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    asyncio.run(audit_columns())
