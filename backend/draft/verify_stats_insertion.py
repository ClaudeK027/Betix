import sys
import os
import asyncio
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def verify_stats():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    match_api_id = 12104504
    print(f"--- VÉRIFICATION DES STATISTIQUES EN DB POUR MATCH API {match_api_id} ---")
    
    # 1. Get internal match ID
    match = db.select("tennis_matches", "id", {"api_id": match_api_id})
    if not match:
        print("❌ Match introuvable en DB.")
        return
    
    m_id = match[0]["id"]
    print(f"✅ Match trouvé. ID Interne : {m_id}")
    
    # 2. Get stats
    stats = db.select("tennis_match_stats", "*", {"match_id": m_id})
    print(f"✅ Lignes de statistiques trouvées : {len(stats)}\n")
    
    if stats:
        print(json.dumps(stats, indent=2))
    else:
        print("❌ Aucune statistique trouvée pour ce match.")

if __name__ == "__main__":
    asyncio.run(verify_stats())
