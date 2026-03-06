"""Quick CLI to test the DataAggregator for any sport/match."""
import asyncio, sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from scripts.draft.data_aggregation import get_match_context

async def main():
    if len(sys.argv) != 3:
        print("Usage: python test_agg_cli.py <sport> <match_internal_id>")
        sys.exit(1)
    
    sport = sys.argv[1]
    match_id = int(sys.argv[2])
    
    print(f"\n{'='*60}")
    print(f"  Aggregating context for {sport.upper()} match {match_id}")
    print(f"{'='*60}\n")
    
    ctx = await get_match_context(sport, match_id)
    print(json.dumps(ctx, indent=2, default=str))

asyncio.run(main())
