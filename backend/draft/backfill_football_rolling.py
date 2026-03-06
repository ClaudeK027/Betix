
import asyncio
import sys
import os
import logging

# Ajout du chemin pour les imports app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST
from scripts.updates.update_match_rolling import SingleMatchRollingUpdater

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s - %(message)s")
logger = logging.getLogger("betix.backfill_rolling")

async def run_backfill():
    settings = get_settings()
    # On utilise analytics schema
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    updater = SingleMatchRollingUpdater("football")
    
    date_cutoff = "2026-02-13T00:00:00"
    
    print(f"--- Demarrage du Backfill Football depuis le {date_cutoff} ---")
    
    # 1. Recuperer les matchs termines depuis le cutoff (chronologique)
    query = f"date_time=gte.{date_cutoff}&status=eq.finished&order=date_time.asc"
    matches = db.select_raw("football_matches", query)
    
    if not matches:
        print("Aucun match trouve.")
        return

    report = {
        "total_matches": len(matches),
        "updated": [],
        "skipped_missing_stats": [],
        "skipped_already_exists": [],
        "errors": []
    }
    
    print(f"Matchs a traiter : {len(matches)}")

    for m in matches:
        api_id = m.get("api_id")
        m_id = m.get("id")
        match_date = m.get("date_time")[:10]
        home_id = m.get("home_team_id")
        away_id = m.get("away_team_id")
        
        # A. Verifier si les stats sont presentes (on attend 2 lignes)
        stats = db.select_raw("football_match_stats", f"match_id=eq.{api_id}")
        if len(stats) < 2:
            print(f"Match {api_id} : Stats incompletes ({len(stats)}/2). Skip.")
            report["skipped_missing_stats"].append(api_id)
            continue
            
        # B. Verifier si le rolling existe deja pour ce match/date
        # On verifie pour la home team (si l'un manque, on considere qu'on doit calculer les 4 entrees du match)
        existing = db.select_raw("football_team_rolling", f"team_id=eq.{home_id}&date=eq.{match_date}")
        if existing:
            # print(f"Match {api_id} : Rolling deja present. Skip.")
            report["skipped_already_exists"].append(api_id)
            continue
            
        # C. Executer l'update
        try:
            print(f"Traitement Match {api_id} ({match_date})...")
            await updater.update(api_id, dry_run=False)
            report["updated"].append(api_id)
        except Exception as e:
            print(f"Erreur sur Match {api_id} : {e}")
            report["errors"].append({"id": api_id, "error": str(e)})

    # Rapport Final
    print("\n--- RAPPORT FINAL BACKFILL FOOTBALL ---")
    print(f"Total Matchs repertories : {report['total_matches']}")
    print(f"Matchs mis a jour        : {len(report['updated'])}")
    print(f"Matchs ignores (Stats manquantes) : {len(report['skipped_missing_stats'])}")
    print(f"Matchs ignores (Deja presents)   : {len(report['skipped_already_exists'])}")
    if report["errors"]:
        print(f"Erreurs rencontrées : {len(report['errors'])}")
        
    # Liste detaillee pour l'utilisateur
    # print("\nListe des IDs mis a jour :", report['updated'])

if __name__ == "__main__":
    asyncio.run(run_backfill())
