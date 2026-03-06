
import socket
import httpx
import asyncio

async def test_conn():
    host = "v3.football.api-sports.io"
    print(f"Testing DNS resolution for {host}...")
    try:
        ip = socket.gethostbyname(host)
        print(f"DNS OK: {host} -> {ip}")
    except Exception as e:
        print(f"DNS FAILED for {host}: {e}")

    url = f"https://{host}/status"
    print(f"\nTesting HTTP connection to {url}...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=5)
            print(f"HTTP OK: Status {resp.status_code}")
    except Exception as e:
        print(f"HTTP FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
