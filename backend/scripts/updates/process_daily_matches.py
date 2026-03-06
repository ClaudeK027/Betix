import asyncio
import os
import sys
import logging
import httpx
from datetime import datetime, timedelta, timezone

# Configuration du chemin pour les imports
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# Logger officiel
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("betix.daily_orchestrator")

class DailyMatchOrchestrator:
    """
    Orchestre la mise à jour quotidienne des matchs pour tous les sports.
    Utilise une approche en deux séquences :
    1. Séquence 1 (Tennis) : Via API-Tennis
    2. Séquence 2 (Foot/Basket) : Via API-Sports
    """
    def __init__(self):
        settings = get_settings()
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        self.sports = ["football", "basketball", "tennis"]
        
    async def run(self):
        logger.info("🚀 Démarrage de l'orchestrateur de mise à jour des matchs.")
        
        # 1. Fenêtre de scan (-10j à +10j pour couvrir décalages et résultats tardifs)
        today = datetime.utcnow().date()
        start_date = (today - timedelta(days=10)).strftime("%Y-%m-%dT00:00:00Z")
        end_date = (today + timedelta(days=10)).strftime("%Y-%m-%dT23:59:59Z")
        
        logger.info(f"📅 Fenêtre de scan : du {start_date} au {end_date}")
        
        # 2. Récupération des matchs non terminés ou récents
        sport_targets = {}
        
        for sport in self.sports:
            table = f"{sport}_matches"
            url = f"{self.db.base_url}/{table}"
            
            # Récupération des matchs qui ne sont pas 'finished' pour vérification
            query_str = f"select=id,api_id,status,date_time&date_time=gte.{start_date}&date_time=lte.{end_date}&status=not.in.(finished,cancelled)&limit=10000"
            full_url = f"{url}?{query_str}"
            
            try:
                resp = httpx.get(full_url, headers=self.db.headers)
                resp.raise_for_status()
                rows = resp.json()
                sport_targets[sport] = rows
                logger.info(f"📊 {sport.capitalize()} : {len(rows)} matchs à vérifier.")
            except Exception as e:
                logger.error(f"❌ Erreur lors de la récupération des matchs pour {sport}: {e}")
                sport_targets[sport] = []
            
        # 3. Lancement des séquences sportives
        logger.info("\n⚙️ --- EXÉCUTION DES SÉQUENCES --- ⚙️")
        
        for sport_key, target_ids in sport_targets.items():
            if not target_ids:
                logger.info(f"💤 Aucune cible pour {sport_key.capitalize()}, séquence ignorée.")
                continue
                
            if sport_key == "tennis":
                await self.sequence_1(sport_key, target_ids)
            elif sport_key in ["football", "basketball"]:
                await self.sequence_2(sport_key, target_ids)
            else:
                logger.warning(f"⚠️ Séquence inconnue pour le sport : {sport_key}")
                
        # 4. Filet de sécurité : matchs bloqués depuis >12h → cancelled
        await self.cleanup_stuck_matches()

        logger.info("🏁 Fin de l'orchestration quotidienne.")

    async def sequence_1(self, sport: str, matches: list):
        """Séquence dédiée au Tennis (API-Tennis)"""
        logger.info(f"\n🎾 [SÉQUENCE 1 - TENNIS] Cibles: {len(matches)}")
        
        settings = get_settings()
        api_key = settings.API_TENNIS_KEY
        missing_stats_ids = []
        
        # Import local des modules d'updates
        from upsert_tennis_data import TennisMatchUpserter
        from pipeline_tennis import run_tennis_pipeline

        upserter = TennisMatchUpserter(self.db, api_key)

        for m in matches:
            api_id = m["api_id"]
            # logger.info(f"🔎 Vérification Match API {api_id}")
            
            # Upsert robuste (gère décalages de dates, scores, status)
            is_finished = await upserter.process_match(m)
            
            # Si le match vient de finir ou est fini, on check les stats
            if is_finished:
                stats_rows = self.db.select("tennis_match_stats", "match_id", {"match_id": m["id"]})
                if len(stats_rows) < 2:
                    logger.info(f"   📌 Match {api_id} : Stats manquantes, ajout à la pipeline.")
                    missing_stats_ids.append(api_id)

        # Déclenchement de la pipeline Tennis
        if missing_stats_ids:
            run_tennis_pipeline(missing_stats_ids)
            
        return missing_stats_ids

    async def sequence_2(self, sport: str, matches: list):
        """Séquence dédiée au Foot/Basket (API-Sports)"""
        logger.info(f"\n⚽🏀 [SÉQUENCE 2 - {sport.upper()}] Cibles: {len(matches)}")
        
        settings = get_settings()
        
        from upsert_fb_data import FBMatchUpserter
        from pipeline_fb import run_fb_pipeline
        
        upserter = FBMatchUpserter(self.db, {
            "football": settings.API_SPORTS_KEY,
            "basketball": settings.API_SPORTS_KEY
        })
        
        missing_stats_targets = []
        
        for m in matches:
            api_id = m["api_id"]
            
            # Upsert Match Data
            is_finished = await upserter.process_match(sport, m)
            
            if is_finished:
                # Vérification des stats en DB
                try:
                    res = self.db.select_raw(f"{sport}_match_stats", f"select=match_id&match_id=eq.{api_id}")
                    if not res:
                        logger.info(f"   📌 Match {api_id} : Stats manquantes, ajout à la pipeline.")
                        missing_stats_targets.append({"api_id": api_id, "sport": sport})
                except Exception as e:
                    logger.error(f"   ❌ Erreur check stats {sport} {api_id}: {e}")
                    
        # Déclenchement de la pipeline FB
        if missing_stats_targets:
            run_fb_pipeline(missing_stats_targets)

    async def cleanup_stuck_matches(self):
        """Filet de sécurité : force 'cancelled' pour tout match encore
        scheduled/imminent dont le kick-off est dépassé de plus de 12 heures."""
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=12)).strftime("%Y-%m-%dT%H:%M:%SZ")

        for sport in self.sports:
            table = f"{sport}_matches"
            query = f"status=in.(scheduled,imminent)&date_time=lte.{cutoff}&select=id,api_id,status"
            try:
                stuck = self.db.select_raw(table, query)
                if not stuck:
                    continue
                logger.warning(f"🧹 {sport.upper()} : {len(stuck)} matchs bloqués (>12h) → cancelled")
                for m in stuck:
                    self.db.update(table, {"status": "cancelled", "status_short": "Annulé"}, {"api_id": m["api_id"]})
                    logger.info(f"   🔒 {sport} api_id={m['api_id']} → cancelled (bloqué >12h)")
            except Exception as e:
                logger.error(f"❌ Erreur cleanup {sport}: {e}")

if __name__ == "__main__":
    orchestrator = DailyMatchOrchestrator()
    asyncio.run(orchestrator.run())
