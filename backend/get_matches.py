import os
import json
import urllib.request
import urllib.parse

def load_env():
    env = {}
    try:
        with open('backend/.env', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip().strip('\"\'')
    except Exception as e:
        print(f"Error loading .env: {e}")
    return env

env = load_env()
url = env.get("SUPABASE_URL")
key = env.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing API configuration in backend/.env")
    exit(1)

ids = ["12107670", "12107687", "12107500", "12107654", "12107693", "12107700", "12107504", "12107649", "12107699", "12107690", "12107647"]
query = urllib.parse.urlencode({'id': f'in.({",".join(ids)})', 'select': 'id,home_team,away_team,date_time'})
req_url = f"{url}/rest/v1/matches?{query}"

req = urllib.request.Request(req_url)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    with urllib.request.urlopen(req, timeout=15) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        print("--- RÉSULTATS DES MATCHS DE LA CAPTURE ---")
        if not data:
            print("Aucune donnée trouvée pour ces IDs.")
        for m in data:
            home = m['home_team'].get('name', 'N/A') if isinstance(m['home_team'], dict) else m['home_team']
            away = m['away_team'].get('name', 'N/A') if isinstance(m['away_team'], dict) else m['away_team']
            print(f"ID: {m['id']} | Joueurs: {home} vs {away} | Date/Heure (UTC): {m['date_time']}")
except Exception as e:
    print(f"Erreur lors de la requête API: {e}")
