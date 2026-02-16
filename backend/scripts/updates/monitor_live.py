"""
BETIX — monitor_live.py
Live Monitor : Suit les matchs 'live'.
1. Met à jour le score en temps réel (pour le suivi Live).
2. Si le match se termine, déclenche la séquence de clôture (Stats -> H2H -> Rolling).

Fréquence idéale : Toutes les 2 minutes.
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

logger = logging.getLogger("betix.live_monitor")

FT_STATUSES = ["FT", "AOT", "PEN"] # Football
FT_STATUSES_BASKET = ["FT", "AOT"] # Basketball usually just FT or AOT

class LiveMatchMonitor:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.API_SPORTS_KEY
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        
        self.clients = {
            "football": httpx.AsyncClient(
                base_url="https://v3.football.api-sports.io", 
                headers={"x-apisports-key": self.api_key},
                timeout=10.0
            ),
            "basketball": httpx.AsyncClient(
                base_url="https://v1.basketball.api-sports.io", 
                headers={"x-apisports-key": self.api_key},
                timeout=10.0
            )
        }
        
        self.stats_updater = SingleMatchStatsUpdater()

    async def close(self):
        for c in self.clients.values():
            await c.aclose()

    async def get_live_matches(self):
        """Récupère les matchs avec status='live'."""
        matches = []
        for sport in ["football", "basketball"]:
            table = f"{sport}_matches"
            query = "status=eq.live&select=id,api_id,status,date_time,home_score,away_score"
            try:
                rows = self.db.select_raw(table, query)
                for r in rows:
                    r["sport"] = sport
                    matches.append(r)
            except Exception as e:
                logger.error(f"❌ DB Error checking {sport}: {e}")
        return matches

    async def check_and_update(self, match):
        sport = match["sport"]
        mid = match["api_id"]
        
        # 1. Fetch Real-time Data
        client = self.clients[sport]
        endpoint = "/fixtures" if sport == "football" else "/games"
        
        try:
            resp = await client.get(endpoint, params={"id": mid})
            if resp.status_code != 200:
                logger.warning(f"⚠️ API Error {mid}: {resp.status_code}")
                return

            data = resp.json().get("response", [])
            if not data: return
            
            item = data[0]
            
            # Match Time Logic
            time_display = None
            
            if sport == "football":
                fixture = item.get("fixture", {})
                status_obj = fixture.get("status", {})
                new_status_short = status_obj.get("short")
                
                elapsed = status_obj.get("elapsed")
                if elapsed:
                    time_display = f"{elapsed}'"
                
                scores = {
                    "home": item["goals"]["home"],
                    "away": item["goals"]["away"]
                }
            else:
                # Basketball (V1 API)
                status_obj = item.get("status", {})
                new_status_short = status_obj.get("short")
                time_display = new_status_short # E.g. Q1, Q2, OT, HT
                
                scores = {
                    "home": item["scores"]["home"]["total"],
                    "away": item["scores"]["away"]["total"]
                }

            # Check for changes
            current_status_db = match["status"] # should be 'live'
            
            # Map API Short Status to DB Status
            # If API says FT/AOT -> DB = 'finished'
            # If API says 1H/2H/Q1/Q2 -> DB = 'live' (we keep it live)
            
            is_finished = False
            db_status = "live"
            
            if sport == "football":
                if new_status_short in FT_STATUSES:
                    is_finished = True
                    db_status = "finished"
                elif new_status_short in ["NS", "TBD"]:
                    # Match hasn't started yet -> Revert to imminent
                    db_status = "imminent"
                elif new_status_short in ["PST", "CANC", "ABD"]:
                    # Match postponed or canceled
                    db_status = "postponed" 
            
            elif sport == "basketball":
                if new_status_short in FT_STATUSES_BASKET:
                    is_finished = True
                    db_status = "finished"
                elif new_status_short in ["NS", "TBD"]:
                    db_status = "imminent"
                elif new_status_short in ["PST", "CANC", "ABD"]:
                    db_status = "postponed"
            
            # Update DB (Score + Status potentially)
            # Only update if scores changed OR status changed OR time changed
            
            current_home = match.get("home_score")
            current_away = match.get("away_score")
            current_time = match.get("status_short")
            
            new_home = scores["home"]
            new_away = scores["away"]
            
            has_score_changed = (new_home != current_home) or (new_away != current_away)
            status_changing = (db_status != current_status_db)
            time_changing = (time_display != current_time)
            
            if has_score_changed or status_changing or time_changing:
                payload = {
                    "home_score": new_home,
                    "away_score": new_away,
                    "status": db_status,
                    "status_short": time_display
                }
                
                self.db.update(f"{sport}_matches", payload, {"api_id": mid})
                logger.info(f"🔄 Match {mid} update: {current_home}-{current_away} ({current_time}) -> {new_home}-{new_away} ({time_display}) | Status: {current_status_db} -> {db_status}")
            
            # TRIGGER COMPLETION if finished
            if is_finished and status_changing:
                logger.info(f"🏁 Match {mid} JUST FINISHED. Triggering completion sequence...")
                await self.run_completion_sequence(sport, mid)
            
        except Exception as e:
            logger.error(f"❌ Error processing {mid}: {e}")

    async def run_completion_sequence(self, sport, match_id):
        # 1. Stats
        try:
            if sport == "football":
                await self.stats_updater.update_football(match_id)
            else:
                await self.stats_updater.update_basketball(match_id)
            logger.info("   [1/3] Match Stats Updated.")
        except Exception as e:
            logger.error(f"   ❌ Stats Update Failed: {e}")

        # 2. H2H
        try:
            h2h_updater = SingleMatchH2HUpdater(sport)
            await h2h_updater.update(match_id)
            await h2h_updater.close()
            logger.info("   [2/3] H2H Updated.")
        except Exception as e:
            logger.error(f"   ❌ H2H Update Failed: {e}")

        # 3. Rolling
        try:
            rolling_updater = SingleMatchRollingUpdater(sport)
            await rolling_updater.update(match_id)
            logger.info("   [3/3] Rolling Stats Updated.")
        except Exception as e:
            logger.error(f"   ❌ Rolling Update Failed: {e}")

    async def run(self):
        live_matches = await self.get_live_matches()
        if not live_matches:
            logger.info("💤 No live matches monitored.")
            await self.close()
            return

        logger.info(f"🟢 Monitoring {len(live_matches)} LIVE matches...")
        
        tasks = [self.check_and_update(m) for m in live_matches]
        await asyncio.gather(*tasks)
        
        await self.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
    monitor = LiveMatchMonitor()
    asyncio.run(monitor.run())
