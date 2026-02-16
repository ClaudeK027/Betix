"""
Background Scheduler for Live Match Updates.
Runs every 5 minutes to fetch live scores and update the database.
"""
import asyncio
import logging
import time
from datetime import datetime
from app.services.ingestion.football_client import FootballClient
from app.services.ingestion.basketball_client import BasketballClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scheduler.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("scheduler")

async def run_cycle():
    logger.info("Starting update cycle...")
    
    # Update Football
    try:
        f_client = FootballClient()
        logger.info("Checking LIVE Football matches...")
        count = await f_client.ingest_live_matches()
        logger.info(f"Football: Updated {count} live matches.")
        await f_client.close()
    except Exception as e:
        logger.error(f"Football error: {e}")

    # Update Basketball
    try:
        b_client = BasketballClient()
        logger.info("Checking LIVE Basketball matches...")
        count = await b_client.ingest_live_matches()
        logger.info(f"Basketball: Updated {count} live matches.")
        await b_client.close()
    except Exception as e:
        logger.error(f"Basketball error: {e}")

    logger.info("Cycle complete.")

async def upload_heartbeat(db):
    try:
        now_iso = datetime.now().isoformat()
        db.upsert('system_config', [{'key': 'heartbeat_schedule_live', 'value': now_iso}], on_conflict='key')
        # logger.info(f"Heartbeat sent: {now_iso}")
    except Exception as e:
        logger.error(f"Failed to send heartbeat: {e}")

async def get_interval():
    try:
        from app.config import get_settings
        from app.services.ingestion.base_client import SupabaseREST
        
        settings = get_settings()
        # Use simple client to fetch config
        db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema='public')
        
        # 0. Heartbeat (Always send heartbeat to show we are alive but maybe paused)
        await upload_heartbeat(db)

        # 1. Check if Active
        rows = db.select('system_config', filters={'key': 'active_schedule_live'})
        if rows and rows[0]['value'] == 'false':
            logger.info("Paused by admin. Sleeping...")
            await asyncio.sleep(60) # Sleep 1 minute before checking again
            continue

        # 2. Get Interval
        rows = db.select('system_config', filters={'key': 'schedule_live_interval'})
        if rows:
            val = int(rows[0]['value'])
            logger.info(f"Configuration loaded: schedule_live_interval = {val}s")
            return val
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
    
    return 300 # Default fallback

async def main():
    logger.info("Scheduler started.")
    while True:
        await run_cycle()
        
        # Determine wait time dynamically
        wait_seconds = await get_interval()
        
        logger.info(f"Sleeping for {wait_seconds} seconds...")
        await asyncio.sleep(wait_seconds)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user.")
