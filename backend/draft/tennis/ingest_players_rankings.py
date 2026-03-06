"""
BETIX — Tennis Players & Rankings Ingestion
Fetches ATP & WTA rankings from api-tennis.com standings endpoint.
Each ranked player is upserted into analytics.players and analytics.tennis_rankings.
"""

import asyncio
import sys
import os
import httpx
import json
from datetime import date, datetime

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST


TOURS = ["ATP", "WTA"]

# Map tour to gender
TOUR_GENDER = {
    "ATP": "M",
    "WTA": "F"
}

# Map movement text to integer
MOVEMENT_MAP = {
    "up": 1,
    "down": -1,
    "same": 0,
}


async def fetch_standings(api_key: str, base_url: str, tour: str) -> list[dict]:
    """Fetch rankings for a specific tour (ATP or WTA)"""
    params = {
        "method": "get_standings",
        "APIkey": api_key,
        "event_type": tour
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(base_url, params=params)
        resp.raise_for_status()
        data = resp.json()
    
    if not data.get("success"):
        print(f"  ❌ API Error for {tour}: {data}")
        return []
    
    results = data.get("result", [])
    print(f"  📊 {tour}: {len(results)} players in standings")
    return results


async def fetch_player_profile(api_key: str, base_url: str, player_key: str) -> dict | None:
    """Fetch detailed player profile (country, birthday, logo)"""
    params = {
        "method": "get_players",
        "APIkey": api_key,
        "player_key": player_key
    }
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("success") and data.get("result"):
                return data["result"][0]
        except Exception as e:
            print(f"    ⚠️ Profile fetch failed for {player_key}: {e}")
    
    return None


def map_player_to_db(standing: dict, tour: str, profile: dict | None) -> dict:
    """Map a standing entry and profile to the players table"""
    
    # Parse info from profile if available
    country = profile.get("player_country") if profile else None
    logo_url = profile.get("player_logo") if profile else None
    plays = profile.get("player_plays") if profile else None
    
    # Extract numerics securely
    height = None
    weight = None
    turned_pro = None
    
    if profile:
        try:
            h = profile.get("player_height", "").replace("cm", "").strip()
            if h: height = int(h)
        except ValueError: pass
        
        try:
            w = profile.get("player_weight", "").replace("kg", "").replace(")", "").strip()
            if w: weight = int(w)
        except ValueError: pass
        
        try:
            tp = profile.get("player_pro", "").strip()
            if tp: turned_pro = int(tp)
        except ValueError: pass
        
    birthdate = None
    if profile and profile.get("player_bday"):
        bday_raw = profile.get("player_bday", "").strip()
        try:
            # API format is usually DD.MM.YYYY
            birthdate = datetime.strptime(bday_raw, "%d.%m.%Y").date().isoformat()
        except ValueError:
            try:
                # Fallback if already YYYY-MM-DD
                birthdate = datetime.strptime(bday_raw, "%Y-%m-%d").date().isoformat()
            except ValueError:
                print(f"    ⚠️ Could not parse birthdate: {bday_raw}")

    return {
        "api_id": int(standing["player_key"]),
        "name": standing.get("player", "Unknown"),
        "gender": TOUR_GENDER[tour],
        "country": country,
        "birthdate": birthdate,
        "height_cm": height,
        "weight_kg": weight,
        "plays": plays,
        "turned_pro": turned_pro,
        "logo_url": logo_url
    }


def map_ranking_to_db(standing: dict, tour: str, internal_player_id: int) -> dict:
    """Map a standing entry to the tennis_rankings table"""
    movement_text = standing.get("movement", "same")
    # Convert movement to numeric change for rank_change_1m
    rank_change = MOVEMENT_MAP.get(movement_text, 0)
    
    return {
        "player_id": internal_player_id,
        "date": date.today().isoformat(),
        "rank": int(standing["place"]),
        "points": int(standing.get("points", 0)),
        "tour": tour,
        "rank_change_1m": rank_change,
        # trend omitted: CHECK constraint on DB, will be addressed separately
    }


async def ingest_players_and_rankings():
    """Main ingestion flow"""
    settings = get_settings()
    api_key = settings.API_TENNIS_KEY
    base_url = settings.API_TENNIS_BASE_URL
    
    if not api_key:
        print("ERROR: API_TENNIS_KEY not set in .env")
        return
    
    db = SupabaseREST(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
        schema="analytics"
    )
    
    today = date.today().isoformat()
    total_players = 0
    total_rankings = 0
    
    for tour in TOURS:
        print(f"\n🎾 Processing {tour} standings...")
        standings = await fetch_standings(api_key, base_url, tour)
        
        if not standings:
            continue
        
        # Limit to top 100 for initial ingestion (saves API quota)
        standings = standings[:100]
        print(f"  📋 Processing top {len(standings)} players")
        
        for i, s in enumerate(standings):
            if not s.get("player_key"):
                print(f"    ⚠️ Skipping player {s.get('player', 'Unknown')} (missing player_key)")
                continue
                
            player_api_id = int(s["player_key"])
            player_name = s.get("player", "Unknown")
            
            # Fetch detailed profile
            profile = await fetch_player_profile(api_key, base_url, s["player_key"])
            
            # 1. Upsert player into analytics.players
            player_record = map_player_to_db(s, tour, profile)
            
            try:
                db.upsert("players", [player_record], on_conflict="api_id")
            except httpx.HTTPStatusError as e:
                # If conflict resolution fails, try without on_conflict
                # The player might already exist
                existing = db.select("players", "id", {"api_id": player_api_id})
                if not existing:
                    print(f"    ❌ Failed to upsert player {player_name}: {e}")
                    continue
            
            # 2. Get internal player ID
            existing = db.select("players", "id", {"api_id": player_api_id})
            if not existing:
                print(f"    ⚠️ Could not find internal ID for {player_name}")
                continue
            
            internal_id = existing[0]["id"]
            
            # 3. Upsert ranking
            ranking_record = map_ranking_to_db(s, tour, internal_id)
            
            try:
                db.upsert("tennis_rankings", [ranking_record], on_conflict="player_id,date")
                total_rankings += 1
            except Exception as e:
                print(f"    ❌ Failed to upsert ranking for {player_name}: {e}")
            
            total_players += 1
            
            if (i + 1) % 25 == 0:
                print(f"  ✅ {i + 1}/{len(standings)} players processed")
        
        print(f"  ✅ {tour} complete: {len(standings)} players processed")
    
    print(f"\n🏆 Done!")
    print(f"   Total players upserted: {total_players}")
    print(f"   Total rankings upserted: {total_rankings}")


if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(ingest_players_and_rankings())
