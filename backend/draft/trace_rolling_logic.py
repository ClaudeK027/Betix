
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

async def trace_logic():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    match_id = 1387895
    team_id = 745 # Home team du match 1203
    match_date = "2026-02-13T18:00:00+00:00"
    
    print(f"--- Tracage de la logique pour le match {match_id}, team {team_id} ---")
    
    # Simuler get_team_history
    safe_date = match_date.replace("+", "%2B")
    query = (
        f"select=id,api_id,home_team_id,away_team_id,home_score,away_score,date_time&"
        f"or=(home_team_id.eq.{team_id},away_team_id.eq.{team_id})&"
        f"date_time=lt.{safe_date}&"
        f"status=eq.finished&"
        f"order=date_time.desc&"
        f"limit=5"
    )
    history = db.select_raw("football_matches", query)
    history = sorted(history, key=lambda x: x["date_time"])
    
    print(f"Historique trouve : {len(history)} matchs.")
    
    # Simuler compute_football_stats
    match_ids = [m["api_id"] for m in history]
    print(f"Recherche stats pour match_ids : {match_ids}")
    
    # Test avec la syntaxe du script original
    stats_rows = db.select("football_match_stats", "*", filters={"match_id": ("in", f"({','.join(map(str, match_ids))})")})
    
    print(f"Stats trouvees via db.select('in', ...) : {len(stats_rows)}")
    
    # Test avec select_raw (approche Tennis)
    raw_query = f"match_id=in.({','.join(map(str, match_ids))})"
    stats_rows_raw = db.select_raw("football_match_stats", raw_query)
    print(f"Stats trouvees via db.select_raw('in.()') : {len(stats_rows_raw)}")

    if stats_rows_raw:
        print("\nStructure d'une ligne de stats :")
        print(stats_rows_raw[0].keys())
        
    print("\nConclusion :")
    if len(stats_rows) == 0 and len(stats_rows_raw) > 0:
        print("!!! ALERTE : La methode db.select('in') ECHOUE alors que select_raw REUSSIT.")
    elif len(stats_rows_raw) == 0:
        print("!!! ALERTE : Aucune stat trouvee meme en select_raw. Verifier le contenu de football_match_stats.")
    else:
        print("Les deux methodes fonctionnent ou echouent identiquement.")

if __name__ == "__main__":
    asyncio.run(trace_logic())
