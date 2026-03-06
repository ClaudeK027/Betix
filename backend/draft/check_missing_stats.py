import sys
import os
import asyncio

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.base_client import SupabaseREST
from app.config import get_settings
from datetime import datetime, timezone, timedelta

def fetch_all(db, table, select="*", filters=None):
    """Fetches all rows from a table, bypassing the 1000 row limit of PostgREST."""
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
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < limit:
            break
        offset += limit
    return all_rows

async def main():
    print("🚀 Début de l'audit EXHAUSTIF (Match par Match, sans limite des 1000 lignes)")
    
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    for sport in ["football", "basketball", "tennis"]:
        print(f"\n--- Analyse {sport.upper()} ---")
        # 1. Obtenir TOUS les matchs terminés (sans limite de 1000) ET dans les 10 derniers jours
        now = datetime.now(timezone.utc)
        ten_days_ago = (now - timedelta(days=10)).strftime("%Y-%m-%dT00:00:00Z")
        
        finished_matches = fetch_all(db, f"{sport}_matches", "id,api_id,date_time", {
            "status": "finished",
            "date_time": ("gte", ten_days_ago) # Filtrer sur les 10 derniers jours
        })
        print(f"Total absolu de Matchs Terminés en DB (depuis {ten_days_ago}): {len(finished_matches)}")
        
        if not finished_matches:
            continue
            
        # 2. Obtenir TOUS les IDs présents dans la table de stats
        stats_table = f"{sport}_match_stats"
        all_stats = fetch_all(db, stats_table, "match_id")
        
        # Uniques IDs
        stats_match_ids = set([int(s["match_id"]) for s in all_stats if s.get("match_id")])
        print(f"Total absolu de Lignes de Stats: {len(all_stats)}")
        print(f"Matchs Uniques Ayant des Stats: {len(stats_match_ids)}")
        
        # 3. Vérification match par match exactement
        missing = []
        for m in finished_matches:
            # Football et Basketball utilisent api_id comme clé étrangère
            # Tennis utilise id interne
            check_id = int(m["api_id"]) if sport != "tennis" else int(m["id"])
            if check_id not in stats_match_ids:
                missing.append((m["id"], check_id))
                
        print(f"❌ Résultat: {len(missing)} matchs Terminés manquent à l'appel dans les stats !")
        if missing:
            print(f"   Exemples d'IDs (internal_id, foreign_key_id) : {missing[:10]}" + ("..." if len(missing) > 10 else ""))

if __name__ == "__main__":
    asyncio.run(main())
