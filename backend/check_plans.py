import urllib.request
import json
import os

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

req_url = f'{url}/rest/v1/plans?select=name,price,trial_price,trial_days'
req = urllib.request.Request(req_url)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
        for p in data:
            print(f"Plan: {p['name']} | Price: {p['price']} | Trial Price: {p.get('trial_price')} | Trial Days: {p.get('trial_days')}")
except Exception as e:
    print(f'ERROR HTTP: {e}')
