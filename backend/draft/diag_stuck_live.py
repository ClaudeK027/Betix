import os, json, urllib.request, ssl
from urllib.parse import urlencode
from dotenv import load_dotenv
load_dotenv('.env')

U = os.getenv('SUPABASE_URL')
K = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
API = os.getenv('API_SPORTS_KEY')
ctx = ssl.create_default_context()

def sb_query(table, params_dict, schema="analytics"):
    qs = urlencode(params_dict, doseq=True)
    url = f"{U}/rest/v1/{table}?{qs}"
    req = urllib.request.Request(url, headers={
        "apikey": K, "Authorization": f"Bearer {K}", "Accept-Profile": schema,
    })
    with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
        return json.loads(resp.read())

def api_query(sport, api_id):
    if sport == "football":
        url = f"https://v3.football.api-sports.io/fixtures?id={api_id}"
    else:
        url = f"https://v1.basketball.api-sports.io/games?id={api_id}"
    req = urllib.request.Request(url, headers={"x-apisports-key": API})
    with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
        data = json.loads(resp.read())
        return data.get("response", [])

# Check the 3 stuck basketball matches on the API
stuck_bk = [454482, 454569, 454571]
print("=== API STATUS FOR STUCK BASKETBALL MATCHES ===")
for api_id in stuck_bk:
    try:
        items = api_query("basketball", api_id)
        if items:
            st = items[0].get("status", {})
            teams = items[0].get("teams", {})
            home = teams.get("home", {}).get("name", "?")
            away = teams.get("away", {}).get("name", "?")
            print(f"  api_id={api_id} | {home} vs {away} | API short='{st.get('short')}' long='{st.get('long')}'")
        else:
            print(f"  api_id={api_id} | NO DATA")
    except Exception as e:
        print(f"  api_id={api_id} | ERROR: {e}")
