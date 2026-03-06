
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.football_client import FootballClient

async def test_api():
    client = FootballClient()
    print(f"Testing FootballClient API get...")
    try:
        # Ligue 1 (api id 61)
        params = {"league": 61, "season": 2024} # Using 2024 to be safe
        data = await client._api_get("/fixtures", params)
        print(f"API result keys: {data.keys()}")
        if data.get("response"):
            print(f"Success! Got {len(data['response'])} fixtures.")
        else:
            print(f"No response data. Errors: {data.get('errors')}")
    except Exception as e:
        print(f"API CALL FAILED: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(test_api())
