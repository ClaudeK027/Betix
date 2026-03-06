
import asyncio
import os
import sys
from app.services.supabase_client import SC

async def diagnostic():
    print("--- Diagnostic des tables Analytics ---")
    tables = ["football_matches", "basketball_matches", "tennis_matches"]
    
    for table in tables:
        try:
            # On récupère une ligne pour voir la structure
            res = SC.analytics.select_raw(table, "select=*&limit=1")
            if res:
                print(f"\nTable: {table}")
                for key, value in res[0].items():
                    print(f"  - {key}: {type(value).__name__} (Value: {value})")
            else:
                print(f"\nTable {table} est vide.")
        except Exception as e:
            print(f"\nErreur sur {table}: {e}")

if __name__ == "__main__":
    # Ajout du path pour les imports
    sys.path.insert(0, os.path.abspath("."))
    asyncio.run(diagnostic())
