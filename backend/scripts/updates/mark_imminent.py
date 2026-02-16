"""
BETIX — mark_imminent.py
Radar automatique : Détecte les matchs qui commencent dans moins de 3 heures
et passe leur statut de 'scheduled' à 'imminent'.

Fréquence idéale : Toutes les 15 minutes.
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

logger = logging.getLogger("betix.imminent_radar")

def mark_imminent_matches():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
    
    now_utc = datetime.now(timezone.utc)
    limit_time = now_utc + timedelta(hours=3)
    
    # Format for API/DB queries (ISO 8601)
    now_str = now_utc.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
    limit_str = limit_time.strftime("%Y-%m-%dT%H:%M:%S") + "Z"
    
    logger.info(f"📡 Radar Imminent : Scanning matches between {now_str} and {limit_str} (UTC)")
    
    total_updated = 0
    
    # Initialize API Clients
    clients = {
        "football": httpx.Client(base_url="https://v3.football.api-sports.io", headers={"x-apisports-key": settings.API_SPORTS_KEY}, timeout=10.0),
        "basketball": httpx.Client(base_url="https://v1.basketball.api-sports.io", headers={"x-apisports-key": settings.API_SPORTS_KEY}, timeout=10.0)
    }

    try:
        for sport in ["football", "basketball"]:
            table = f"{sport}_matches"
            
            # Query: status=scheduled AND date_time <= limit AND date_time >= now
            # Note: On protège le "+" du timezone s'il y en a
            
            query = (
                f"status=eq.scheduled&"
                f"date_time=gte.{now_str}&"
                f"date_time=lte.{limit_str}&"
                f"select=id,api_id,date_time"
            )
            
            try:
                matches = db.select_raw(table, query)
                if not matches:
                    continue
                    
                logger.info(f"   👉 {sport.upper()} : Found {len(matches)} matches potentially imminent.")
                
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
                        
                        if sport == "football":
                            fixture = item.get("fixture", {})
                            new_status_short = fixture.get("status", {}).get("short")
                            new_date = fixture.get("date")
                        else:
                            new_status_short = item.get("status", {}).get("short")
                            new_date = item.get("date")
                            
                        # Logic for Imminent
                        # If Time is indeed < 3h -> Imminent
                        # If API says "PST" -> Postponed
                        # If API says "NS" but time is changed -> Update time, keep scheduled/imminent
                        
                        target_status = "imminent"
                        
                        if new_status_short in ["PST", "CANC", "ABD"]:
                            target_status = "postponed"
                        elif new_status_short in ["NS", "TBD"]:
                            target_status = "imminent"
                        else:
                             # If it started already (LIVE, FT), we can set it to LIVE or let mark_live handle it?
                             # Let's set it to LIVE/FINISHED if it's already there to be safe/speedy.
                             ft_list = ["FT", "AOT", "PEN"] if sport == "football" else ["FT", "AOT"]
                             if new_status_short in ft_list:
                                 target_status = "finished"
                             else:
                                 target_status = "live"
                        
                        # Prepare Payload
                        payload = {"status": target_status}
                        if new_date: payload["date_time"] = new_date
                        
                        # We don't update scores here usually (scheduled), but we could.
                        # Let's keep it light.
                        
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
        logger.info("💤 No new imminent matches found.")
    else:
        logger.info(f"🚀 Radar Complete. {total_updated} matches updated.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
    mark_imminent_matches()
