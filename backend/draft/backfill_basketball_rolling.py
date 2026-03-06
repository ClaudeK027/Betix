
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
logger = logging.getLogger("betix.backfill_rolling_basket")

async def run_backfill():
    settings = get_settings()
    # On utilise analytics schema
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    updater = SingleMatchRollingUpdater("basketball")
    
    date_cutoff = "2026-02-13T00:00:00"
    
    print(f"--- Demarrage du Backfill Basketball depuis le {date_cutoff} ---")
    
    # 1. Recuperer les matchs termines depuis le cutoff (chronologique)
    query = f"date_time=gte.{date_cutoff}&status=eq.finished&order=date_time.asc"
    matches = db.select_raw("basketball_matches", query)
    
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
        stats = db.select_raw("basketball_match_stats", f"match_id=eq.{api_id}")
        if len(stats) < 2:
            print(f"Match {api_id} : Stats incompletes ({len(stats)}/2). Skip.")
            report["skipped_missing_stats"].append(api_id)
            continue
            
        # B. Verifier si le rolling existe deja pour ce match/date (on ignore pour notre test témoin au besoin)
        # Mais ici on veut verifier que le rolling est absent pour ne pas tout recalculer inutilement.
        # Attention: l'utilisateur a dit "vérifier que le rolling de la confrontation est bien absent"
        existing = db.select_raw("basketball_team_rolling", f"team_id=eq.{home_id}&date=eq.{match_date}")
        
        # Pour le basketball, on veut peut-etre forcer la mise a jour de notre match temoin (470268) 
        # pour s'assurer qu'il a le tout dernier format de liste si pas deja fait, 
        # mais le script update utilise on_conflict donc c'est safe.
        
        if existing and api_id != 470268: # On skip sauf notre match temoin pour etre sur
            report["skipped_already_exists"].append(api_id)
            continue
            
        # C. Executer l'update
        try:
            print(f"Traitement Match Basketball {api_id} ({match_date})...")
            await updater.update(api_id, dry_run=False)
            report["updated"].append(api_id)
        except Exception as e:
            print(f"Erreur sur Match {api_id} : {e}")
            report["errors"].append({"id": api_id, "error": str(e)})

    # Rapport Final
    print("\n--- RAPPORT FINAL BACKFILL BASKETBALL ---")
    print(f"Total Matchs repertories : {report['total_matches']}")
    print(f"Matchs mis a jour        : {len(report['updated'])}")
    print(f"Matchs ignores (Stats manquantes) : {len(report['skipped_missing_stats'])}")
    print(f"Matchs ignores (Deja presents)   : {len(report['skipped_already_exists'])}")
    if report["errors"]:
        print(f"Erreurs rencontrées : {len(report['errors'])}")

if __name__ == "__main__":
    asyncio.run(run_backfill())
