
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def verify_football():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    # Match témoin du 13/02
    res = db.select_raw("football_team_rolling", "date=eq.2026-02-13&team_id=in.(743,745)")
    
    if not res:
        print("Aucune donnee trouvee dans football_team_rolling pour ce match.")
        return

    print(f"--- Verification exhaustive des donnees inserees ({len(res)} lignes) ---")
    for row in res:
        print(f"\nEquipe: {row.get('team_id')} | Lieu: {row.get('venue')}")
        # On affiche tous les champs pour voir les NULL
        for key, value in row.items():
            if value is None:
                print(f"  [NULL] {key}")
            else:
                print(f"  [OK]   {key}: {value}")

if __name__ == "__main__":
    asyncio.run(verify_football())
