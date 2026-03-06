"""Test the ORIGINAL data_aggregation.py with football 4302."""
import asyncio, sys, os, json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Import the ORIGINAL version
from app.engine.data_aggregation import get_match_context

async def main():
    sport = sys.argv[1] if len(sys.argv) > 1 else "football"
    match_id = int(sys.argv[2]) if len(sys.argv) > 2 else 4302
    
    print(f"\n{'='*60}")
    print(f"  ORIGINAL aggregator: {sport.upper()} match {match_id}")
    print(f"{'='*60}\n")
    
    ctx = await get_match_context(sport, match_id)
    print(json.dumps(ctx, indent=2, default=str))

asyncio.run(main())
