"""
Daily Ingestion Scheduler.
Runs continuously to check if daily ingestion is needed.
Triggers ingestion for Football and Basketball for the next X days.
"""
import asyncio
import logging
import os
from datetime import datetime, timedelta, date
from dotenv import load_dotenv

from app.services.ingestion.football_client import FootballClient
from app.services.ingestion.basketball_client import BasketballClient
from app.services.ingestion.tennis_client import TennisClient
from app.services.ingestion.base_client import SupabaseREST

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("daily_ingestion.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("daily_scheduler")

async def get_config(db: SupabaseREST, key: str, default: str) -> str:
    rows = db.select('system_config', filters={'key': key})
    if rows:
        return rows[0]['value']
    return default

async def set_last_run(db: SupabaseREST):
    today_str = date.today().isoformat()
    db.update('system_config', {'value': today_str, 'updated_at': 'now()'}, {'key': 'daily_ingestion_last_run'})

async def run_ingestion(days_ahead: int):
    logger.info(f"🚀 Starting DAILY INGESTION for next {days_ahead} days...")
    
    football = FootballClient()
    basketball = BasketballClient()
    tennis = TennisClient()
    
    today = date.today()
    
    for i in range(days_ahead + 1):
        target_date = today + timedelta(days=i)
        date_str = target_date.isoformat()
        logger.info(f"  -> Ingesting for {date_str}...")
        
        # Football
        try:
            await football.ingest_matches_for_date(target_date)
            logger.info(f"     [Football] Done for {date_str}")
        except Exception as e:
            logger.error(f"     [Football] Failed for {date_str}: {e}")

        # Basketball
        try:
            await basketball.ingest_matches_for_date(target_date)
            logger.info(f"     [Basketball] Done for {date_str}")
        except Exception as e:
            logger.error(f"     [Basketball] Failed for {date_str}: {e}")
            
        # Tennis
        try:
            await tennis.ingest_matches_for_date(target_date)
            logger.info(f"     [Tennis] Done for {date_str}")
        except Exception as e:
            logger.error(f"     [Tennis] Failed for {date_str}: {e}")

    logger.info("✅ Daily Ingestion Complete.")

async def upload_heartbeat(db):
    try:
        now_iso = datetime.now().isoformat()
        db.upsert('system_config', [{'key': 'heartbeat_daily_ingestion', 'value': now_iso}], on_conflict='key')
    except Exception as e:
        logger.error(f"Failed to send heartbeat: {e}")

async def main():
    logger.info("Daily Scheduler started.")
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        logger.error("Missing SUPABASE credentials")
        return

    db = SupabaseREST(url, key, schema='public')

    while True:
        try:
            # 0. Heartbeat
            await upload_heartbeat(db)

            # 1. Check if Active
            rows = db.select('system_config', filters={'key': 'active_daily_ingestion'})
            if rows and rows[0]['value'] == 'false':
                logger.info("Paused by admin. Sleeping...")
                await asyncio.sleep(60)
                continue

            # 2. Load Config
            target_hour = int(await get_config(db, 'daily_ingestion_hour', '3'))
            days_ahead = int(await get_config(db, 'daily_ingestion_days_ahead', '7'))
            last_run_str = await get_config(db, 'daily_ingestion_last_run', '1970-01-01')
            
            now = datetime.now()
            today_str = now.date().isoformat()
            
            # 2. Check Conditions
            # Condition A: Current hour >= Target Hour
            # Condition B: Last run was NOT today
            
            hour_ok = now.hour >= target_hour
            not_run_today = last_run_str != today_str
            
            if hour_ok and not_run_today:
                logger.info(f"Conditions met (Hour {now.hour}>={target_hour}, Last: {last_run_str}). Running ingestion...")
                await run_ingestion(days_ahead)
                await set_last_run(db)
            else:
                logger.info(f"Skipping ingestion. Hour: {now.hour}/{target_hour}, LastRun: {last_run_str}, Today: {today_str}")

        except Exception as e:
            logger.error(f"Error in main loop: {e}")

        # Sleep for 30 minutes
        logger.info("Sleeping for 1800s...")
        await asyncio.sleep(1800)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Stopped by user.")
