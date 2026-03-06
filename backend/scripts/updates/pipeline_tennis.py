import os
import sys
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("draft.tennis_pipeline")

def run_tennis_pipeline(api_ids: list):
    """
    Exécute la pipeline de mise à jour (Stats -> H2H -> Rolling) pour chaque match terminé.
    """
    if not api_ids:
        logger.info("🎾 [PIPELINE TENNIS] Aucun match à traiter dans la pipeline.")
        return

    logger.info(f"🚀 [PIPELINE TENNIS] Démarrage de la pipeline pour {len(api_ids)} match(s) : {api_ids}")
    
    # Chemin vers le dossier des scripts d'update
    scripts_dir = os.path.dirname(__file__)
    
    scripts_to_run = [
        "update_tennis_stats.py",
        "update_tennis_h2h.py",
        "update_tennis_rolling.py"
    ]

    for api_id in api_ids:
        logger.info(f"\n   ⚙️ Début de la pipeline pour le match {api_id}")
        
        for script_name in scripts_to_run:
            script_path = os.path.join(scripts_dir, script_name)
            
            # Log de l'exécution
            logger.info(f"      -> Exécution de : {script_name} pour {api_id}")
            
            # Appel effectif du script via sys.executable
            cmd = [sys.executable, script_path, "--match-id", str(api_id)]
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, check=False)
                if result.returncode != 0:
                    logger.error(f"      ❌ Erreur dans {script_name} pour {api_id} : {result.stderr}")
                else:
                    logger.info(f"      ✅ Succès : {script_name}")
            except Exception as e:
                logger.error(f"      ❌ Exception lors de l'exécution de {script_name} : {e}")

        logger.info(f"   🏁 Fin de la pipeline pour le match {api_id}\n")
        
    logger.info("✅ [PIPELINE TENNIS] Processus complètement terminé.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-ids", type=int, nargs="+", help="Liste d'IDs à traiter")
    args = parser.parse_args()
    if args.api_ids:
        run_tennis_pipeline(args.api_ids)
    else:
        run_tennis_pipeline([12104504])
