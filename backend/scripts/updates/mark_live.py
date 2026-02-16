"""
BETIX — mark_live.py
Kick-off Radar : Détecte les matchs 'imminent' qui commencent dans moins de 5 minutes
et passe leur statut à 'live'.

Fréquence idéale : Toutes les 5 minutes.
"""

import logging
import sys
import os
import httpx
from datetime import datetime, timedelta, timezone

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

logger = logging.getLogger("betix.live_switch")

def mark_live_matches():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    now_utc = datetime.now(timezone.utc)
    # On regarde 5 minutes dans le futur
    limit_time = now_utc + timedelta(minutes=5)
    
    # Format ISO 8601
    # Note: On prend tout ce qui est <= limit_time (donc y compris ce qui a déjà commencé il y a 1 min)
    limit_str = limit_time.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
    
    logger.info(f"🟢 Radar Live : Scanning 'imminent' matches starting before {limit_str} (UTC)")
    
    total_updated = 0
    
    # Initialize API Clients
    clients = {
        "football": httpx.Client(base_url="https://v3.football.api-sports.io", headers={"x-apisports-key": settings.API_SPORTS_KEY}, timeout=10.0),
        "basketball": httpx.Client(base_url="https://v1.basketball.api-sports.io", headers={"x-apisports-key": settings.API_SPORTS_KEY}, timeout=10.0)
    }

    try:
        for sport in ["football", "basketball"]:
            table = f"{sport}_matches"
            
            # Query: status=imminent AND date_time <= limit_time
            # Using select to get IDs
            query = (
                f"status=eq.imminent&"
                f"date_time=lte.{limit_str}&"
                f"select=id,api_id,date_time"
            )
            
            try:
                matches = db.select_raw(table, query)
                if not matches:
                    continue
                    
                logger.info(f"   👉 {sport.upper()} : Found {len(matches)} matches potentially kicking off.")
                
                client = clients[sport]
                endpoint = "/fixtures" if sport == "football" else "/games"
                
                for m in matches:
                    mid = m["api_id"]
                    try:
                        # Fetch Real Data
                        resp = client.get(endpoint, params={"id": mid})
                        if resp.status_code != 200:
                            logger.warning(f"      ⚠️ API Error {mid}: {resp.status_code}")
                            continue

                        data = resp.json().get("response", [])
                        if not data: continue
                        
                        item = data[0]
                        new_status_short = None
                        new_date = None
                        scores = {}

                        if sport == "football":
                            fixture = item.get("fixture", {})
                            new_status_short = fixture.get("status", {}).get("short")
                            new_date = fixture.get("date")
                            goals = item.get("goals", {})
                            scores = {"home": goals.get("home"), "away": goals.get("away")}
                        else:
                            new_status_short = item["status"]["short"]
                            new_date = item["date"]
                            scores = {
                                "home": item["scores"]["home"]["total"],
                                "away": item["scores"]["away"]["total"]
                            }
                            
                        # Logic: Only switch to LIVE if it's actually playing
                        # If NS/TBD -> Keep Imminent (or update time if changed)
                        # If FT -> Finish (handled by daily, but we can set it)
                        # The goal here is "Switch to Live" mainly.
                        
                        ft_list = ["FT", "AOT", "PEN"] if sport == "football" else ["FT", "AOT"]
                        target_status = "live"
                        
                        if new_status_short in ["NS", "TBD"]:
                            target_status = "imminent" # Don't switch yet
                        elif new_status_short in ["PST", "CANC", "ABD"]:
                            target_status = "postponed"
                        elif new_status_short in ft_list:
                             target_status = "finished"
                        
                        # Prepare Payload
                        payload = {
                            "status": target_status,
                            "date_time": new_date,
                            "status_short": new_status_short if sport == "basketball" else (f"{item.get('fixture', {}).get('status', {}).get('elapsed')}'" if sport == "football" and item.get('fixture', {}).get('status', {}).get('elapsed') else None)
                        }
                        if scores.get("home") is not None: payload["home_score"] = scores["home"]
                        if scores.get("away") is not None: payload["away_score"] = scores["away"]
                        
                        db.update(table, payload, {"api_id": mid})
                        logger.info(f"      ✅ Match {mid} update: Status={target_status}, Time={new_date}")
                        total_updated += 1
                        
                    except Exception as e:
                        logger.error(f"      ❌ Failed to update {mid}: {e}")
            except Exception as e:
                logger.error(f"❌ Error scanning {sport}: {e}")
                
    finally:
        for c in clients.values():
            c.close()

    if total_updated == 0:
        logger.info("💤 No matches switching to LIVE.")
    else:
        logger.info(f"🚀 Live Switch Complete. {total_updated} matches updated.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
    mark_live_matches()
