
import asyncio
import sys
import os

# Ajout du chemin pour importer les modules de l'app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def check_match():
    settings = get_settings()
    # On travaille dans le schéma analytics
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    date_start = "2026-02-13T00:00:00"
    
    print(f"--- Recherche du match de basket le plus ancien depuis le {date_start} ---")
    
    # 1. Récupérer le match le plus ancien à partir du 13/02
    query = f"date_time=gte.{date_start}&status=eq.finished&order=date_time.asc&limit=1"
    matches = db.select_raw("basketball_matches", query)
    
    if not matches:
        print("Aucun match trouvé à partir de cette date.")
        return

    match = matches[0]
    m_id = match.get("id")
    m_api_id = match.get("api_id")
    home_id = match.get("home_team_id")
    away_id = match.get("away_team_id")
    dt = match.get("date_time")
    
    print(f"Match trouvé :")
    print(f"  - ID interne : {m_id}")
    print(f"  - API ID     : {m_api_id}")
    print(f"  - Date/Heure : {dt}")
    print(f"  - Home Team ID (interne) : {home_id}")
    print(f"  - Away Team ID (interne) : {away_id}")
    
    # 2. Vérifier les stats dans basketball_match_stats
    print(f"\n--- Vérification de basketball_match_stats pour match_id {m_api_id} ---")
    stats_query = f"match_id=eq.{m_api_id}"
    stats = db.select_raw("basketball_match_stats", stats_query)
    
    if not stats:
        print("--- AUCUNE stat trouvee dans basketball_match_stats pour ce match.")
    else:
        print(f"--- {len(stats)} ligne(s) de statistiques trouvee(s).")
        for s in stats:
            team_id = s.get("team_id")
            print(f"  - Ligne pour Team ID : {team_id}")
        
        if len(stats) == 2:
            print("\nConclusion : La table basketball_match_stats est complete pour ce match (2 lignes).")
        else:
            print(f"\nConclusion : Table incomplete ({len(stats)}/2 lignes).")

if __name__ == "__main__":
    asyncio.run(check_match())
