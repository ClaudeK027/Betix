
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.ingestion.basketball_client import BasketballClient
from app.services.ingestion.tennis_client import TennisClient

async def test_api():
    # Basketball
    b_client = BasketballClient()
    print(f"Testing BasketballClient API get...")
    try:
        data = await b_client._api_get("/games", {"date": "2025-02-20", "league": 12})
        print(f"Basketball API result keys: {data.keys()}")
        if data.get("response"):
            print(f"Success! Got {len(data['response'])} games.")
        else:
            print(f"No response. Error: {data.get('errors')}")
    except Exception as e:
        print(f"Basketball API FAILED: {e}")
    finally:
        await b_client.close()

    # Tennis
    t_client = TennisClient()
    print(f"\nTesting TennisClient API get...")
    try:
        data = await t_client._api_get("", {"method": "get_fixtures", "date_start": "2025-02-20", "date_stop": "2025-02-20"})
        print(f"Tennis API result keys: {data.keys()}")
        if data.get("result"):
            print(f"Success! Got {len(data['result'])} fixtures.")
        else:
            print(f"No result. Success: {data.get('success')}")
    except Exception as e:
        print(f"Tennis API FAILED: {e}")
    finally:
        await t_client.close()

if __name__ == "__main__":
    asyncio.run(test_api())
