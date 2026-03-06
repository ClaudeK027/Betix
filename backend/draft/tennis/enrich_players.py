"""
Enrich existing tennis players in analytics.players with profile data
from api-tennis.com. Only patches fields the API actually provides:
  country, birthdate, logo_url

Usage:
  python enrich_players.py          # enrich ALL players missing data
  python enrich_players.py --test   # enrich ONLY 1 player (dry-run verification)
"""
import sys, os, json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

import httpx
from datetime import datetime
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

settings = get_settings()
API_KEY = settings.API_TENNIS_KEY
BASE_URL = settings.API_TENNIS_BASE_URL


def fetch_profile(client: httpx.Client, player_key: int) -> dict | None:
    """Fetch player profile (sync, reuses client connection)."""
    params = {
        "method": "get_players",
        "APIkey": API_KEY,
        "player_key": str(player_key)
    }
    try:
        resp = client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        if data.get("success") and data.get("result"):
            return data["result"][0]
    except Exception as e:
        print(f"    ⚠️ API error for key {player_key}: {e}")
    return None


def build_patch(profile: dict) -> dict:
    """Build the PATCH payload from API profile.
    Only includes fields the API actually provides."""
    patch = {}

    # Country
    c = profile.get("player_country")
    if c:
        patch["country"] = c

    # Logo URL
    logo = profile.get("player_logo")
    if logo:
        patch["logo_url"] = logo

    # Birthdate (API format: DD.MM.YYYY → YYYY-MM-DD)
    bday = (profile.get("player_bday") or "").strip()
    if bday:
        for fmt in ("%d.%m.%Y", "%Y-%m-%d"):
            try:
                patch["birthdate"] = datetime.strptime(bday, fmt).date().isoformat()
                break
            except ValueError:
                continue

    return patch


def main():
    test_mode = "--test" in sys.argv

    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    # 1. Load players
    print("📋 Loading players from DB...")
    players = db.select("players", "id,api_id,name,country,birthdate,logo_url", {})
    print(f"  Found {len(players)} players")

    # 2. Filter: only those missing data
    to_enrich = [p for p in players if not p.get("country") or not p.get("birthdate") or not p.get("logo_url")]
    print(f"  {len(to_enrich)} need enrichment")

    if not to_enrich:
        print("✅ All players already complete!")
        return

    if test_mode:
        to_enrich = to_enrich[:1]
        print(f"\n🧪 TEST MODE: only processing 1 player")

    enriched = 0
    errors = 0

    with httpx.Client(timeout=15.0) as api_client:
        for i, player in enumerate(to_enrich):
            api_id = player["api_id"]
            name = player.get("name", "?")

            profile = fetch_profile(api_client, api_id)
            if not profile:
                errors += 1
                continue

            patch = build_patch(profile)
            if not patch:
                print(f"    ⚠️ No enrichment data for {name}")
                continue

            # Use db.update (PATCH) to modify existing row
            try:
                result = db.update("players", patch, {"api_id": api_id})
                enriched += 1
                if test_mode:
                    print(f"\n  ✅ Patched {name} (api_id={api_id}):")
                    print(f"     Sent: {json.dumps(patch, indent=2)}")
                    print(f"     DB returned: {json.dumps(result[0] if result else {}, indent=2)}")
            except Exception as e:
                print(f"    ❌ {name}: {e}")
                errors += 1

            if not test_mode and (i + 1) % 25 == 0:
                print(f"  ✅ {i + 1}/{len(to_enrich)} processed")

    if not test_mode and len(to_enrich) % 25 != 0:
        print(f"  ✅ {len(to_enrich)}/{len(to_enrich)} processed")

    print(f"\n🏆 Done! enriched={enriched}, errors={errors}, skipped={len(players) - len(to_enrich)}")

    if test_mode:
        print("\n🔍 Verification — re-read this player from DB:")
        p = to_enrich[0]
        verify = db.select("players", "name,country,birthdate,logo_url", {"api_id": f"eq.{p['api_id']}"})
        if verify:
            print(f"  {json.dumps(verify[0], indent=2)}")
        else:
            print("  ❌ Could not re-read player!")


if __name__ == "__main__":
    main()
