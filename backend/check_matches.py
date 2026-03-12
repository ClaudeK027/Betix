import urllib.request
import urllib.parse
import json
import os
import socket

# Force IPv4 resolution
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [response for response in responses if response[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

def get_env():
    env = {}
    env_path = 'd:/Kaizen D/AI_Dev/BETIX/backend/.env'
    try:
         with open(env_path, encoding='utf-8') as f:
             for line in f:
                 if '=' in line and not line.startswith('#'):
                     k, v = line.strip().split('=', 1)
                     env[k] = v.strip().strip('\"\'')
    except Exception as e:
         pass
    return env

env = get_env()
url = env.get('SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY')

ids = ['12107670', '12107687', '12107500', '12107654', '12107693', '12107700', '12107504', '12107649', '12107699', '12107690', '12107647']
query_str = f'api_sport_id=in.({",".join(ids)})&select=api_sport_id,home_team,away_team,date_time'
req_url = f'{url}/rest/v1/matches?{query_str}'

req = urllib.request.Request(req_url)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        content = response.read().decode('utf-8')
        data = json.loads(content)
        print('--- RESULTATS DES MATCHES ---')
        d_out = []
        for m in data:
            home = m['home_team'].get('name', 'N/A') if isinstance(m['home_team'], dict) else m['home_team']
            away = m['away_team'].get('name', 'N/A') if isinstance(m['away_team'], dict) else m['away_team']
            d_out.append(f"ID: {m.get('api_sport_id')} | Joueurs: {home} vs {away} | Date: {m['date_time']}")
        print('\n'.join(d_out))
except urllib.error.HTTPError as e:
    print(f'ERROR HTTP: {e.code} - {e.read().decode()}')
except Exception as e:
    print(f'ERROR HTTP: {e}')
