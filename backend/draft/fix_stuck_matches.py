"""Fix 3 stuck basketball matches: set status from 'live' to 'postponed'."""
import os, json, urllib.request, ssl
from dotenv import load_dotenv
load_dotenv('.env')

U = os.getenv('SUPABASE_URL')
K = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
ctx = ssl.create_default_context()

stuck_ids = [454482, 454569, 454571]

for aid in stuck_ids:
    url = f"{U}/rest/v1/basketball_matches?api_id=eq.{aid}"
    data = json.dumps({"status": "postponed"}).encode()
    req = urllib.request.Request(url, data=data, method='PATCH', headers={
        "apikey": K,
        "Authorization": f"Bearer {K}",
        "Content-Profile": "analytics",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    })
    try:
        urllib.request.urlopen(req, timeout=10, context=ctx)
        print(f"OK api_id={aid} -> postponed")
    except Exception as e:
        print(f"ERROR api_id={aid}: {e}")

# Verify
print("\nVerification:")
from urllib.parse import urlencode
qs = urlencode({"status": "eq.live", "select": "api_id,status,status_short"})
req2 = urllib.request.Request(f"{U}/rest/v1/basketball_matches?{qs}", headers={
    "apikey": K, "Authorization": f"Bearer {K}", "Accept-Profile": "analytics",
})
with urllib.request.urlopen(req2, timeout=10, context=ctx) as resp:
    remaining = json.loads(resp.read())
    print(f"Remaining basketball live matches: {len(remaining)}")
    for m in remaining:
        print(f"  {m}")
