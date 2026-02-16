"""
BETIX — process_daily_matches.py
Script d'automatisation "One-Shot" pour la clôture des matchs du jour.

Objectif :
1. Recherche les matchs du jour NON terminés dans la DB.
2. Vérifie leur statut réel via API.
3. Si terminé : Met à jour Statut/Score DB + Lance la chaîne de mise à jour (Stats -> H2H -> Rolling).

Usage :
    python backend/scripts/updates/process_daily_matches.py
"""

import asyncio
import logging
import sys
import os
import httpx
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# Import Updaters
from scripts.updates.update_match_stats import SingleMatchStatsUpdater
from scripts.updates.update_match_h2h import SingleMatchH2HUpdater
from scripts.updates.update_match_rolling import SingleMatchRollingUpdater

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("betix.daily_process")

FT_STATUSES = ["FT", "AOT", "PEN"] # Statuses considered "Finished" by API-Sports

class DailyMatchProcessor:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.API_SPORTS_KEY
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        
        # API Clients
        self.clients = {
            "football": httpx.AsyncClient(base_url="https://v3.football.api-sports.io", headers={"x-apisports-key": self.api_key}),
            "basketball": httpx.AsyncClient(base_url="https://v1.basketball.api-sports.io", headers={"x-apisports-key": self.api_key})
        }
        
        # Updaters
        self.stats_updater = SingleMatchStatsUpdater()
        # H2H and Rolling are instantiated per sport/call usually, but classes are stateless enough or light.
        
    async def close(self):
        for c in self.clients.values():
            await c.aclose()
            
    async def get_matches_to_check(self):
        """Récupère les matchs du jour (UTC) qui ne sont PAS 'finished'."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        # today = "2026-02-14" # DEBUG Override if needed
        logger.info(f"📅 Checking matches for date: {today}")
        
        matches = []
        for sport in ["football", "basketball"]:
            table = f"{sport}_matches"
            # On cherche les matchs du jour qui ne sont PAS finished
            # Note: On récupère status, id, api_id
            query = f"date_time=gte.{today}T00:00:00&date_time=lte.{today}T23:59:59&status=neq.finished&select=id,api_id,status,date_time"
            try:
                rows = self.db.select_raw(table, query)
                for r in rows:
                    r["sport"] = sport
                    matches.append(r)
            except Exception as e:
                logger.error(f"❌ DB Error checking {sport}: {e}")
                
        logger.info(f"🔎 Found {len(matches)} active/pending matches to check.")
        return matches

    async def check_match_status_api(self, sport: str, match_id: int):
        """Vérifie le statut live via API."""
        client = self.clients[sport]
        endpoint = "/fixtures" if sport == "football" else "/games"
        formatted_id = {"id": match_id} # Both APIs use 'id'
        
        try:
            resp = await client.get(endpoint, params=formatted_id)
            if resp.status_code != 200:
                logger.warning(f"⚠️ API Error {resp.status_code} for {sport} {match_id}")
                return None
            
            data = resp.json().get("response", [])
            if not data: return None
            
            item = data[0]
            
            status_short = None
            date_time = None
            scores = {}
            
            if sport == "football":
                fixture = item.get("fixture", {})
                status_short = fixture.get("status", {}).get("short")
                date_time = fixture.get("date")
                goals = item.get("goals", {})
                scores = {
                    "home": goals.get("home"),
                    "away": goals.get("away")
                }
            elif sport == "basketball":
                status_short = item["status"]["short"]
                date_time = item["date"]
                scores = {
                    "home": item["scores"]["home"]["total"],
                    "away": item["scores"]["away"]["total"]
                }
            
            return {"status": status_short, "scores": scores, "date_time": date_time}
            
        except Exception as e:
            logger.error(f"❌ API Check Error: {e}")
            return None

    def normalize_status(self, sport, short_status, current_db_status):
        """Map API status to DB status."""
        # 1. FINISHED
        ft_list = FT_STATUSES if sport == "football" else ["FT", "AOT"]
        if short_status in ft_list:
            return "finished"
            
        # 2. POSTPONED / CANCELED
        if short_status in ["PST", "CANC", "ABD"]:
            return "postponed"
            
        # 3. NOT STARTED
        if short_status in ["NS", "TBD"]:
            # If DB is 'imminent', we allow it to stay imminent (it's just scheduled <3h)
            if current_db_status == "imminent":
                return "imminent"
            return "scheduled"
            
        # 4. LIVE / PLAYING (1H, 2H, Q1, etc.)
        return "live"

    async def run(self):
        matches = await self.get_matches_to_check()
        
        for m in matches:
            sport = m["sport"]
            match_id = m["api_id"]
            current_status = m["status"]
            current_date = m["date_time"] # ISO String from DB
            
            logger.info(f"🔄 Checking {sport.upper()} Match {match_id} (DB: {current_status})...")
            
            api_info = await self.check_match_status_api(sport, match_id)
            if not api_info: continue
            
            real_status_short = api_info["status"]
            real_date = api_info["date_time"]
            real_scores = api_info["scores"]
            
            # Determine normalized DB status
            new_db_status = self.normalize_status(sport, real_status_short, current_status)
            
            # Check for divergences
            # Note: We compare basics. 
            status_changed = (new_db_status != current_status)
            date_changed = False 
            # Basic string compare for date usually works if both are ISO. 
            # API returns OFFSET usually. DB might be same.
            # If loose match, we update anyway.
            if real_date and current_date and real_date[:16] != current_date[:16]:
                 # Compare up to minute to avoid format diffs causing noise? 
                 # Or just update always. Let's update if strings differ at all for safety.
                 date_changed = True
                 
            # Check scores (handle None vs 0 nuances if needed, but usually equality works)
            # DB scores might be None or int.
            home_score = real_scores.get("home")
            away_score = real_scores.get("away")
            
            # Update Payload construction
            payload = {}
            if status_changed: payload["status"] = new_db_status
            if date_changed: payload["date_time"] = real_date
            
            # Always check score diff
            # We trust API scores. If None, we might leave them or set to None.
            # Usually API returns None for NS.
            if home_score is not None: payload["home_score"] = home_score
            if away_score is not None: payload["away_score"] = away_score
            
            # UPDATE DB if needed
            if payload:
                try:
                    table = f"{sport}_matches"
                    self.db.update(table, payload, {"api_id": match_id})
                    logger.info(f"   ✅ Updated {match_id}: Status={new_db_status} (was {current_status}), Date Updated?={date_changed}")
                except Exception as e:
                    logger.error(f"   ❌ DB Update Failed: {e}")
            else:
                logger.info(f"   💤 No changes for {match_id}.")

            # TRIGGER COMPLETION SEQUENCE only if purely finished NOW
            # (i.e. status changed to 'finished')
            if new_db_status == "finished" and current_status != "finished":
                logger.info(f"🏁 Match {match_id} just FINISHED! Triggering Sequence...")
                
                # 2. Update Stats
                try:
                    if sport == "football":
                        await self.stats_updater.update_football(match_id)
                    else:
                        await self.stats_updater.update_basketball(match_id)
                    logger.info("   [1/3] Match Stats Updated.")
                except Exception as e:
                    logger.error(f"   ❌ Stats Update Failed: {e}")

                # 3. Update H2H
                try:
                    h2h_updater = SingleMatchH2HUpdater(sport)
                    await h2h_updater.update(match_id)
                    await h2h_updater.close()
                    logger.info("   [2/3] H2H Updated.")
                except Exception as e:
                    logger.error(f"   ❌ H2H Update Failed: {e}")

                # 4. Update Rolling
                try:
                    rolling_updater = SingleMatchRollingUpdater(sport)
                    await rolling_updater.update(match_id)
                    logger.info("   [3/3] Rolling Stats Updated.")
                except Exception as e:
                    logger.error(f"   ❌ Rolling Update Failed: {e}")

        await self.close()
        logger.info("🏁 Daily Process Completed.")

if __name__ == "__main__":
    current_path = os.getcwd()
    # Force run from backend dir if needed contextually, but sys.path handles imports.
    processor = DailyMatchProcessor()
    asyncio.run(processor.run())
