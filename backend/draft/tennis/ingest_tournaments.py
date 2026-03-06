"""
BETIX — Tennis Tournament Ingestion
Fetches major ATP & WTA Singles tournaments from api-tennis.com
and inserts them into analytics.tennis_tournaments.
"""

import asyncio
import sys
import os
import httpx
import json
from datetime import datetime

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST


# Event type keys from api-tennis.com (get_events endpoint)
# key -> tour
TOUR_FILTERS = {
    265: "ATP",   # Atp Singles
    266: "WTA",   # Wta Singles
}


async def fetch_tournaments(api_key: str, base_url: str) -> list[dict]:
    """Fetch all tournaments from api-tennis.com"""
    url = base_url
    params = {
        "method": "get_tournaments",
        "APIkey": api_key
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    
    if not data.get("success"):
        print(f"API Error: {data}")
        return []
    
    return data.get("result", [])


def filter_major_tournaments(tournaments: list[dict]) -> list[dict]:
    """Keep only ATP Singles & WTA Singles tournaments"""
    filtered = []
    for t in tournaments:
        event_key = t.get("event_type_key")
        # API returns int keys
        if event_key in TOUR_FILTERS:
            filtered.append(t)
    
    print(f"Filtered {len(filtered)} major tournaments from {len(tournaments)} total")
    return filtered


def map_tournament_to_db(t: dict) -> dict:
    """Map API tournament to our DB schema"""
    event_key = t.get("event_type_key")
    tour = TOUR_FILTERS.get(event_key, "ATP")
    # Use the API event_type_type directly as category (e.g. "Atp Singles", "Wta Singles")
    category = t.get("event_type_type", "Singles")
    
    return {
        "api_id": int(t["tournament_key"]),
        "name": t["tournament_name"],
        "category": category,
        "tour": tour,
        # surface and indoor_outdoor will be filled later from fixtures
        "surface": None,
        "indoor_outdoor": None,
        "prize_money_usd": None,
    }


async def ingest_tournaments():
    """Main ingestion flow"""
    settings = get_settings()
    api_key = settings.API_TENNIS_KEY
    base_url = settings.API_TENNIS_BASE_URL
    
    if not api_key:
        print("ERROR: API_TENNIS_KEY not set in .env")
        return
    
    print(f"🎾 Fetching tournaments from {base_url}...")
    all_tournaments = await fetch_tournaments(api_key, base_url)
    
    if not all_tournaments:
        print("No tournaments returned from API")
        return
    
    # Filter for major categories
    major = filter_major_tournaments(all_tournaments)
    
    # Map to DB format
    db_records = [map_tournament_to_db(t) for t in major]
    
    # Upsert into Supabase
    db = SupabaseREST(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
        schema="analytics"
    )
    
    print(f"📤 Upserting {len(db_records)} tournaments...")
    
    # Upsert in batches of 50
    batch_size = 50
    inserted = 0
    for i in range(0, len(db_records), batch_size):
        batch = db_records[i:i + batch_size]
        try:
            db.upsert("tennis_tournaments", batch, on_conflict="api_id")
            inserted += len(batch)
            print(f"  ✅ Batch {i // batch_size + 1}: {len(batch)} tournaments")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1} failed: {e}")
    
    print(f"\n🏆 Done! {inserted}/{len(db_records)} tournaments ingested.")
    
    # Print summary
    atp_count = sum(1 for r in db_records if r["tour"] == "ATP")
    wta_count = sum(1 for r in db_records if r["tour"] == "WTA")
    print(f"   ATP Singles: {atp_count}")
    print(f"   WTA Singles: {wta_count}")


if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(ingest_tournaments())
