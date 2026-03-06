"""Test ciblé de fetch_odds multi-marchés — sans asyncio.gather."""
import asyncio, sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST
from app.engine.data_aggregation import DataAggregator

async def main():
    agg = DataAggregator()
    
    # Trouver un match avec cotes
    sample = agg.db.select_raw("odds_snapshots", "select=match_id,sport&limit=1")
    if not sample:
        print("❌ Aucun snapshot en base")
        return
    
    mid = sample[0]["match_id"]
    sp = sample[0]["sport"]
    print(f"🎯 Test fetch_odds pour {sp} #{mid}\n")
    
    # Test direct de fetch_odds
    odds = await agg.fetch_odds(sp, mid)
    
    if odds is None:
        print("❌ ERREUR: odds est None")
        return
        
    print(f"✅ {len(odds)} marchés récupérés :")
    for mk, data in odds.items():
        od = data["odds_data"]
        preview = json.dumps(od, ensure_ascii=False)[:120] if isinstance(od, (list, dict)) else str(od)[:120]
        print(f"   📊 {mk}: {preview}")
    
    print(f"\n🔍 Détail complet du premier marché :")
    first_mk = list(odds.keys())[0]
    print(json.dumps(odds[first_mk], indent=2, ensure_ascii=False, default=str))

asyncio.run(main())
