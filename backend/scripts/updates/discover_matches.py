"""
BETIX — discover_matches.py (AUTO-INGEST)
Version finale optimisée :
1. Découverte intelligente (Range Football, Daily Basketball silencieux).
2. Comparaison Delta avec la DB (Batch check).
3. Ingestion automatique des données manquantes (Analytics + Public schemas).
"""

import asyncio
import logging
import argparse
import sys
import os
from datetime import datetime, timedelta, timezone

# Configuration du chemin pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.football_client import FootballClient
from app.services.ingestion.basketball_client import BasketballClient

# Désactivation des logs verbeux
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("betix.discovery")

async def get_missing_items(client, table: str, api_items: list[dict], sport: str):
    """Filtre les items API pour ne garder que ceux absents de la DB."""
    if not api_items:
        return []
        
    # Mapping api_id -> full_item
    id_map = {}
    for item in api_items:
        mid = item.get("fixture", {}).get("id") if sport == "football" else item.get("id")
        if mid:
            id_map[mid] = item
            
    api_ids = list(id_map.keys())
    existing_ids = set()
    
    # Batch check DB
    chunk_size = 100
    for i in range(0, len(api_ids), chunk_size):
        chunk = api_ids[i:i+chunk_size]
        ids_str = ",".join(map(str, chunk))
        try:
            rows = client.analytics.select_raw(table, f"select=api_id&api_id=in.({ids_str})")
            for r in rows:
                existing_ids.add(r["api_id"])
        except Exception as e:
            logger.error(f"   ⚠️ DB Error during delta check: {e}")
            
    missing_items = [id_map[mid] for mid in api_ids if mid not in existing_ids]
    return missing_items

async def ingest_missing(client, missing_items: list[dict]):
    """Transforme et insère les items manquants dans les deux schémas."""
    if not missing_items:
        return 0
        
    # Chargement des maps d'ID (nécessaire pour build_public_match)
    if not client._team_id_map: client._load_team_id_map()
    if not client._league_id_map: client._load_league_id_map()
    
    analytics_rows = []
    public_rows = []
    
    for item in missing_items:
        row = client._transform_match(item)
        if row:
            analytics_rows.append(row)
            pub_row = client._build_public_match(row)
            if pub_row:
                public_rows.append(pub_row)
                
    if analytics_rows:
        try:
            # Upsert Analytics
            client.analytics.upsert(client._get_analytics_matches_table(), analytics_rows, on_conflict="api_id")
            # Upsert Public
            if public_rows:
                client.public.upsert("matches", public_rows, on_conflict="api_sport_id,sport")
            return len(analytics_rows)
        except Exception as e:
            logger.error(f"   ❌ Ingestion error: {e}")
            
    return 0

async def discovery_football(start_date: str, end_date: str):
    logger.info(f"⚽ [FOOTBALL] Scanning range {start_date} to {end_date}...")
    client = FootballClient()
    try:
        all_api_items = []
        for api_league_id in client.league_ids.keys():
            params = {"league": api_league_id, "season": 2025, "from": start_date, "to": end_date}
            data = await client._api_get("/fixtures", params)
            all_api_items.extend(data.get("response", []))
            await asyncio.sleep(0.1)
            
        missing = await get_missing_items(client, "football_matches", all_api_items, "football")
        if missing:
            logger.info(f"   🚨 Found {len(missing)} missing Football matches. Ingesting...")
            count = await ingest_missing(client, missing)
            logger.info(f"   ✅ Ingested {count} Football matches.")
        else:
            logger.info("   ✅ Football is up to date.")
        return len(all_api_items), len(missing)
    finally:
        await client.close()

async def discovery_basketball(start_date_obj, days: int):
    logger.info(f"🏀 [BASKETBALL] Scanning {days} days...")
    client = BasketballClient()
    try:
        all_api_items = []
        target_leagues = set(client.league_ids.keys())
        for i in range(days):
            date_str = (start_date_obj + timedelta(days=i)).strftime("%Y-%m-%d")
            data = await client._api_get("/games", {"date": date_str})
            items = data.get("response", [])
            all_api_items.extend([it for it in items if it.get("league", {}).get("id") in target_leagues])
            await asyncio.sleep(0.05)
            
        missing = await get_missing_items(client, "basketball_matches", all_api_items, "basketball")
        if missing:
            logger.info(f"   🚨 Found {len(missing)} missing Basketball matches. Ingesting...")
            count = await ingest_missing(client, missing)
            logger.info(f"   ✅ Ingested {count} Basketball matches.")
        else:
            logger.info("   ✅ Basketball is up to date.")
        return len(all_api_items), len(missing)
    finally:
        await client.close()

async def main():
    parser = argparse.ArgumentParser(description="BETIX Auto-Ingest Discovery")
    parser.add_argument("--days", type=int, default=10)
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    start_date = now.strftime("%Y-%m-%d")
    end_date = (now + timedelta(days=args.days-1)).strftime("%Y-%m-%d")

    logger.info(f"🚀 Starting Auto-Ingest for the next {args.days} days")

    await discovery_football(start_date, end_date)
    await discovery_basketball(now, args.days)

    logger.info("🏁 Discovery and Ingestion completed.")

if __name__ == "__main__":
    asyncio.run(main())
