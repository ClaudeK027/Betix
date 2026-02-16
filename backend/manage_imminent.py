"""
Manage 'Imminent' Status for Matches.
Runs periodically to check for upcoming matches starting within 3 hours.
Updates their status from 'upcoming' to 'imminent'.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("imminent_manager.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("imminent_manager")

async def check_and_update_imminent():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    # 1. Calculate threshold time (now + 3 hours)
    now = datetime.now(timezone.utc)
    threshold = now + timedelta(hours=3)
    
    logger.info(f"Checking for matches starting before {threshold.isoformat()}")

    # 2. Fetch 'upcoming' matches that are starting soon
    # We query public.matches directly
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{url}/rest/v1/matches",
                params={
                    "select": "id,home_team,date_time",
                    "status": "eq.upcoming",
                    "date_time": f"lte.{threshold.isoformat()}",
                    "order": "date_time.asc"
                },
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                }
            )
            
            if resp.status_code >= 300:
                logger.error(f"Failed to fetch matches: {resp.status_code} - {resp.text}")
                return

            matches = resp.json()
            
            if not matches:
                logger.info("No imminent matches found.")
                return

            logger.info(f"Found {len(matches)} matches to mark as IMMINENT.")
            
            # 3. Update status to 'imminent'
            for m in matches:
                match_id = m['id']
                home_name = m['home_team'].get('name', 'Unknown')
                logger.info(f"Marking match {match_id} ({home_name}) as imminent...")
                
                update_resp = await client.patch(
                    f"{url}/rest/v1/matches",
                    params={"id": f"eq.{match_id}"},
                    json={"status": "imminent"},
                    headers={
                        "apikey": key,
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    }
                )
                
                if update_resp.status_code < 300:
                    logger.info(f"✅ Match {match_id} updated.")
                    # Trigger the placeholder update function (currently just logging)
                    await trigger_update_function(match_id)
                else:
                    logger.error(f"❌ Failed to update match {match_id}: {update_resp.text}")

    except Exception as e:
        logger.error(f"Error in check_and_update_imminent: {e}")

async def trigger_update_function(match_id: str):
    """
    Placeholder for the update function triggered when a match becomes imminent.
    This could fetch data from API, schedule data refresh, etc.
    """
    logger.info(f"⚡ TRIGGER: Update function called for match {match_id} (IMMINENT)")
    # TODO: Add logic here to schedule data update or fetch API data
    pass

async def upload_heartbeat(db):
    try:
        now_iso = datetime.now().isoformat()
        db.upsert('system_config', [{'key': 'heartbeat_manage_imminent', 'value': now_iso}], on_conflict='key')
    except Exception as e:
        logger.error(f"Failed to send heartbeat: {e}")

async def get_interval():
    try:
        from app.services.ingestion.base_client import SupabaseREST
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        # Use simple client to fetch config
        db = SupabaseREST(url, key, schema='public')

        # 0. Heartbeat
        await upload_heartbeat(db)

        # 1. Check if Active
        rows = db.select('system_config', filters={'key': 'active_manage_imminent'})
        if rows and rows[0]['value'] == 'false':
            logger.info("Paused by admin. Sleeping...")
            await asyncio.sleep(60)
            continue

        # 2. Get Config
        rows = db.select('system_config', filters={'key': 'imminent_check_interval'})
        if rows:
            val = int(rows[0]['value'])
            logger.info(f"Configuration loaded: imminent_check_interval = {val}s")
            return val
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
    
    return 600 # Default fallback

async def main():
    logger.info("Imminent Manager started.")
    while True:
        await check_and_update_imminent()
        
        # Determine wait time dynamically
        wait_seconds = await get_interval()
        
        logger.info(f"Sleeping for {wait_seconds} seconds...")
        await asyncio.sleep(wait_seconds)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Imminent Manager stopped by user.")
