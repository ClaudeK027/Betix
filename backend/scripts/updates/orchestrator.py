"""
BETIX — orchestrator.py
Le "Cerveau" qui gère l'automatisation temporelle.
Lance les différents radars à leurs fréquences respectives.

Fréquences :
- monitor_live : 2 min
- mark_live : 5 min
- mark_imminent : 15 min
- daily_cleanup : 1 heure
"""

import asyncio
import logging
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Import logic from scripts
from scripts.updates.mark_imminent import mark_imminent_matches
from scripts.updates.mark_live import mark_live_matches
from scripts.updates.monitor_live import LiveMatchMonitor
from scripts.updates.process_daily_matches import DailyMatchProcessor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    force=True,
    handlers=[
        logging.FileHandler("automation.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("betix.orchestrator")

async def run_forever():
    logger.info("🚀 BETIX Orchestrator Starting...")
    
    iteration = 0
    
    while True:
        try:
            # 1. MONITOR LIVE (Every 2 minutes approx - actually every loop)
            # Puisque c'est le plus fréquent, on base la boucle dessus (60s ou 120s)
            logger.info("--- ⏱️ Start Cycle ---")
            
            # MONITOR LIVE
            monitor = LiveMatchMonitor()
            await monitor.run()
            
            # MARK LIVE (Every 4 mins - every 2nd iteration)
            if iteration % 2 == 0:
                mark_live_matches()
                
            # MARK IMMINENT (Every 16 mins - every 8th iteration)
            if iteration % 8 == 0:
                mark_imminent_matches()
            
            # DAILY CLEANUP (Every hour - every 30th iteration)
            if iteration % 30 == 0:
                processor = DailyMatchProcessor()
                await processor.run()

            iteration += 1
            if iteration > 1000: iteration = 0 # Reset
            
            logger.info("--- 💤 Sleeping 2 minutes ---")
            await asyncio.sleep(120) 
            
        except Exception as e:
            logger.error(f"💥 Orchestrator Critical Error: {e}")
            await asyncio.sleep(60) # Wait before retry

if __name__ == "__main__":
    try:
        asyncio.run(run_forever())
    except KeyboardInterrupt:
        logger.info("👋 Orchestrator stopped by user.")
