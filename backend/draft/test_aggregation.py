"""
Test the DataAggregator for all 3 sports.
"""
import asyncio, sys, os, json, logging
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")

from scripts.draft.data_aggregation import get_match_context
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

def truncate(obj, max_items=2):
    """Truncate lists in a dict for readable output."""
    if isinstance(obj, dict):
        return {k: truncate(v, max_items) for k, v in obj.items()}
    elif isinstance(obj, list):
        if len(obj) > max_items:
            return obj[:max_items] + [f"... +{len(obj)-max_items} more"]
        return [truncate(i, max_items) for i in obj]
    return obj

async def main():
    settings = get_settings()
    db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")

    # ── 1. TENNIS ──
    print("=" * 60)
    print("🎾 TENNIS")
    print("=" * 60)
    tennis_rows = db.select_raw("tennis_matches", "select=id,api_id&status=eq.finished&limit=1")
    if tennis_rows:
        tid = tennis_rows[0]["id"]
        print(f"   Match ID: {tid} (api: {tennis_rows[0]['api_id']})")
        ctx = await get_match_context("tennis", tid)
        print(json.dumps(truncate(ctx), indent=2, default=str))
        
        # Validate key fields
        assert ctx["meta"]["sport"] == "tennis"
        assert "player1" in ctx and "player2" in ctx
        assert "summary" in ctx["h2h"] and "last_5_meetings" in ctx["h2h"]
        print("\n✅ Tennis: All assertions passed!")
    else:
        print("   ❌ No finished tennis match in DB.")
    
    print()

    # ── 2. FOOTBALL ──
    print("=" * 60)
    print("⚽ FOOTBALL")
    print("=" * 60)
    foot_rows = db.select_raw("football_matches", "select=id,api_id&status=eq.finished&limit=1")
    if foot_rows:
        fid = foot_rows[0]["id"]
        print(f"   Match ID: {fid} (api: {foot_rows[0]['api_id']})")
        ctx = await get_match_context("football", fid)
        print(json.dumps(truncate(ctx), indent=2, default=str))
        
        assert ctx["meta"]["sport"] == "football"
        assert "home_team" in ctx and "away_team" in ctx
        print("\n✅ Football: All assertions passed!")
    else:
        print("   ❌ No finished football match in DB.")

    print()
    
    # ── 3. BASKETBALL ──
    print("=" * 60)
    print("🏀 BASKETBALL")
    print("=" * 60)
    basket_rows = db.select_raw("basketball_matches", "select=id,api_id&status=eq.finished&limit=1")
    if basket_rows:
        bid = basket_rows[0]["id"]
        print(f"   Match ID: {bid} (api: {basket_rows[0]['api_id']})")
        ctx = await get_match_context("basketball", bid)
        print(json.dumps(truncate(ctx), indent=2, default=str))
        
        assert ctx["meta"]["sport"] == "basketball"
        assert "home_team" in ctx and "away_team" in ctx
        print("\n✅ Basketball: All assertions passed!")
    else:
        print("   ❌ No finished basketball match in DB.")

    print()
    print("🏁 All tests complete!")

asyncio.run(main())
