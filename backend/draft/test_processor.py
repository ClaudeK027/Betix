import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.getcwd())))

from scripts.updates.process_daily_matches import DailyMatchProcessor

async def test_processor():
    processor = DailyMatchProcessor()
    
    match_id = 12104847
    print(f"Testing check_match_status_api for tennis, ID: {match_id}")
    
    # Needs a date string since the processor expects one, though the API fix uses it for start/stop
    res = await processor.check_match_status_api("tennis", match_id, match_date="2026-02-23")
    
    print("\n--- RESULTS ---")
    if res:
        print(f"Status Raw: {res.get('status')}")
        # Test normalization
        norm_status = processor.normalize_status("tennis", res.get('status'), "live")
        print(f"Status Normalized (DB target): {norm_status}")
        print(f"Scores: {res.get('scores')}")
        print(f"Date Time Parsed: {res.get('date_time')}")
    else:
        print("❌ Processor returned None (Failed to parse/fetch).")
        
    await processor.close()

if __name__ == "__main__":
    asyncio.run(test_processor())
