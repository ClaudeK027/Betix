import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.base_client import SupabaseREST
from app.config import get_settings

def fetch_all(db, table, select="*", filters=None):
    all_rows = []
    offset = 0
    limit = 1000
    while True:
        params = [f"select={select}", f"limit={limit}", f"offset={offset}"]
        if filters:
            for k, v in filters.items():
                if isinstance(v, tuple) and len(v) == 2:
                    op, val = v
                    params.append(f"{k}={op}.{val}")
                else:
                    params.append(f"{k}=eq.{v}")
        query = "&".join(params)
        rows = db.select_raw(table, query)
        if not rows: break
        all_rows.extend(rows)
        if len(rows) < limit: break
        offset += limit
    return all_rows

async def main():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    # Let's get match 12104931
    match_rows = db.select_raw("tennis_matches", "api_id=eq.12104931&select=id,api_id,player1_id,player2_id")
    print(f"Match 12104931: {match_rows}")
    
    if match_rows:
        p1_internal = match_rows[0].get("player1_id")
        p2_internal = match_rows[0].get("player2_id")
        
        players = db.select_raw("players", f"id=in.({p1_internal},{p2_internal})&select=id,api_id,name")
        print(f"Internal players mapped to: {players}")
        
    api_missings = db.select_raw("players", "api_id=in.(95770,90887)&select=id,api_id,name")
    print(f"API players missing query returned: {api_missings}")

if __name__ == "__main__":
    asyncio.run(main())
