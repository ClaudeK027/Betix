"""
BETIX — fetch_h2h_v2.py
Smart Discovery Strategy:
1. Récupère les matchs existants (DB) pour identifier les paires réelles.
2. Élimine les redondances (Arsenal-Chelsea = Chelsea-Arsenal).
3. Interroge l'API uniquement pour ces paires.
4. Gère les limites API (Retry) et l'état d'avancement (Resume).
"""

import logging
import argparse
import asyncio
import json
import os
import signal
import sys
from datetime import datetime
from collections import defaultdict

import httpx
from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

# Configuration
# On utilise un formateur minimaliste pour la lisibilité
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("betix.h2h_smart")
settings = get_settings()

API_KEY = settings.API_SPORTS_KEY 
STATE_FILE_TEMPLATE = "h2h_progress_{sport}.json"

# --- SPORT CONFIGURATION ---
SPORT_CONFIG = {
    "football": {
        "base_url": "https://v3.football.api-sports.io",
        "api_host": "v3.football.api-sports.io",
        "endpoint": "/fixtures/headtohead",
        "match_table": "football_matches",
        "h2h_table": "football_h2h",
        "team_table": "teams",
    },
    "basketball": {
        "base_url": "https://v1.basketball.api-sports.io",
        "api_host": "v1.basketball.api-sports.io",
        "endpoint": "/games", 
        "match_table": "basketball_matches",
        "h2h_table": "basketball_h2h",
        "team_table": "teams",
    }
}

class H2HIngestor:
    def __init__(self, sport: str, limit: int = 0, reset: bool = False):
        self.sport = sport
        self.limit = limit
        self.conf = SPORT_CONFIG[sport]
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        self.client = httpx.AsyncClient(
            base_url=self.conf["base_url"],
            headers={
                "x-rapidapi-key": API_KEY,
                "x-rapidapi-host": self.conf["api_host"]
            },
            timeout=20.0 # Augmenté pour éviter les timeout sur chargements lourds
        )
        self.state_file = STATE_FILE_TEMPLATE.format(sport=sport)
        
        # Reset Logic
        if reset and os.path.exists(self.state_file):
            logger.info("🗑️  Reset activé : Suppression de l'état sauvegardé.")
            try:
                os.remove(self.state_file)
            except Exception as e:
                logger.warning(f"⚠️  Impossible de supprimer le fichier d'état : {e}")

        self.mapping = {} # internal_id -> api_id
        
        # Graceful shutdown
        self.running = True
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        logger.warning(f"🛑 Signal reçu ({signum}). Arrêt gracieux...")
        self.running = False

    async def load_mapping(self):
        """Charge le mapping ID interne -> API ID pour les équipes."""
        logger.info("🗺️  Chargement du mapping IDs...")
        offset = 0
        while self.running:
            rows = self.db.select_raw(
                "teams", 
                f"select=id,api_id&sport=eq.{self.sport}&limit=1000&offset={offset}"
            )
            if not rows: break
            for r in rows:
                self.mapping[r["id"]] = r["api_id"]
            if len(rows) < 1000: break
            offset += len(rows)
        logger.info(f"✅ Mapping chargé : {len(self.mapping)} équipes.")

    async def get_smart_pairs(self):
        """Récupère les paires uniques depuis les matchs existants en DB."""
        logger.info(f"🕵️  Smart Discovery: Analyse des matchs ({self.conf['match_table']})...")
        pairs = set()
        offset = 0
        while self.running:
            # FIX PAGING: Supabase limite à 1000. Demander 2000 causait un arrêt prématuré.
            rows = self.db.select_raw(
                self.conf["match_table"], 
                f"select=home_team_id,away_team_id&limit=1000&offset={offset}"
            )
            if not rows: break
            
            for r in rows:
                h, a = r.get("home_team_id"), r.get("away_team_id")
                if h and a and h != a:
                    pair = tuple(sorted((h, a)))
                    pairs.add(pair)
            
            # Print progress sur la même ligne
            print(f"   ...scan {offset + len(rows)} matchs", end="\r")
            
            if len(rows) < 1000: break
            offset += len(rows)
            
        print("") # Newline après print \r
        logger.info(f"👉 {len(pairs)} duels uniques identifiés sur un scan de {offset} matchs.")
        return list(pairs)

    def load_state(self):
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r") as f:
                    return json.load(f)
            except: pass
        return {"processed_index": 0}

    def save_state(self, index):
        state = {"processed_index": index, "updated_at": datetime.now().isoformat()}
        with open(self.state_file, "w") as f:
            json.dump(state, f)

    async def fetch_with_retry(self, url, params):
        """Wrapper API avec gestion 429 et Quota JSON."""
        retries = 0
        max_retries = 8
        base_delay = 3.0 # Un peu plus long pour laisser le quota respirer

        while retries < max_retries and self.running:
            try:
                resp = await self.client.get(url, params=params)
                
                if resp.status_code == 200:
                    data = resp.json()
                    
                    if data.get("errors"):
                        errs = data["errors"]
                        # Détection Rate Limit (Dict ou List)
                        err_str = str(errs).lower()
                        if "rate" in err_str or "limit" in err_str:
                            wait_time = min(base_delay * (2 ** retries), 60)
                            logger.warning(f"⚠️ Quota Error (JSON). Pause {wait_time}s... (Essai {retries+1}/{max_retries})")
                            await asyncio.sleep(wait_time)
                            retries += 1
                            continue 
                        
                        logger.warning(f"⚠️ API Logic Error : {errs}")
                        return []
                    
                    return data.get("response", [])
                
                elif resp.status_code == 429:
                    wait_time = min(base_delay * (2 ** retries), 60)
                    logger.warning(f"⏳ HTTP 429. Pause {wait_time}s...")
                    await asyncio.sleep(wait_time)
                    retries += 1
                
                elif resp.status_code >= 500:
                    logger.warning(f"🚨 Server Error {resp.status_code}. Retry...")
                    await asyncio.sleep(5)
                    retries += 1
                else:
                    logger.error(f"❌ API Error {resp.status_code}: {resp.text}")
                    return None
            except Exception as e:
                logger.error(f"❌ Network Error: {e}")
                await asyncio.sleep(5)
                retries += 1
        
        return None

    def process_api_response(self, data, team_a, team_b, api_a):
        """Transforme la réponse API en objet DB."""
        if not data: return None

        try:
            date_key = lambda x: x["fixture"]["date"] if self.sport == "football" else x["date"]
            data.sort(key=date_key, reverse=True)
        except: pass

        wins_a, wins_b, draws = 0, 0, 0
        score_a_total, score_b_total, games_count = 0, 0, 0
        last_5_res = []
        detailed_history = [] 

        for item in data:
            if self.sport == "football":
                s_home, s_away = item["goals"]["home"], item["goals"]["away"]
                fid_home, match_date = item["teams"]["home"]["id"], item["fixture"]["date"]
            else: # basketball
                s_home = item["scores"]["home"]["total"] if isinstance(item["scores"]["home"], dict) else item["scores"]["home"]
                s_away = item["scores"]["away"]["total"] if isinstance(item["scores"]["away"], dict) else item["scores"]["away"]
                fid_home, match_date = item["teams"]["home"]["id"], item["date"]

            if s_home is None or s_away is None: continue

            # Normalisation vs Team A
            if fid_home == api_a:
                s_for, s_against, is_home = s_home, s_away, True
            else:
                s_for, s_against, is_home = s_away, s_home, False
            
            score_a_total += s_for
            score_b_total += s_against
            games_count += 1

            if s_for > s_against: wins_a += 1; res_code = "W"
            elif s_against > s_for: wins_b += 1; res_code = "L"
            else: draws += 1; res_code = "D"
            
            if len(last_5_res) < 5: last_5_res.append(res_code)
            
            if self.sport == "basketball" and len(detailed_history) < 5:
                winner = "A" if res_code == "W" else ("B" if res_code == "L" else "D")
                detailed_history.append({
                    "date": match_date,
                    "score": f"{s_for}-{s_against}" if is_home else f"{s_against}-{s_for}",
                    "winner": winner
                })

        if games_count == 0: return None

        row = {"team_a_id": team_a, "team_b_id": team_b, "updated_at": datetime.now().isoformat()}

        if self.sport == "football":
            row.update({
                "team_a_wins": wins_a, "team_b_wins": wins_b, "draws": draws, "total_matches": games_count,
                "avg_goals_a": round(score_a_total / games_count, 2),
                "avg_goals_b": round(score_b_total / games_count, 2),
                "last_5_results": last_5_res
            })
        else: # basketball
            row.update({
                "season": 9999, "games_played": games_count, "team_a_wins": wins_a,
                "avg_margin": round((score_a_total - score_b_total) / games_count, 1),
                "last_results": detailed_history
            })
        return row

    async def run(self):
        logger.info(f"🚀 Ingestion H2H ({self.sport.upper()})")
        await self.load_mapping()
        all_pairs = await self.get_smart_pairs()
        
        state = self.load_state()
        start_index = state["processed_index"]
        
        pairs_to_process = all_pairs[start_index:]
        if self.limit > 0: pairs_to_process = pairs_to_process[:self.limit]

        if not pairs_to_process:
            logger.info("✅ Aucune nouvelle paire à traiter.")
            return

        logger.info(f"📋 Progression : {start_index}/{len(all_pairs)} | Reste : {len(pairs_to_process)}")
        
        # --- FILTRE & VITESSE ---
        # User limit is 300 r/m. Target safely ~150 r/m.
        # Semaphore(4) with 1s sleep => ~2.5 r/s => 150 r/m max.
        sem = asyncio.Semaphore(4) 
        
        async def process_task(idx, ta, tb):
            api_a, api_b = self.mapping.get(ta), self.mapping.get(tb)
            if not api_a or not api_b: return None
            
            async with sem:
                await asyncio.sleep(1.0) # Safety delay
                if not self.running: return None
                
                data = await self.fetch_with_retry(self.conf["endpoint"], {"h2h": f"{api_a}-{api_b}"})
                return self.process_api_response(data, ta, tb, api_a)

        buffer = []
        chunk_size = 10 
        
        for i in range(0, len(pairs_to_process), chunk_size):
            if not self.running: break
            
            chunk = pairs_to_process[i : i+chunk_size]
            current_abs_index = start_index + i
            
            tasks = [process_task(current_abs_index + j, ta, tb) for j, (ta, tb) in enumerate(chunk)]
            results = await asyncio.gather(*tasks)
            
            valid = [r for r in results if r]
            buffer.extend(valid)
            
            # Upsert frequent pour éviter de tout perdre
            if len(buffer) >= 20 or (i + chunk_size >= len(pairs_to_process)):
                try:
                    cols = "team_a_id,team_b_id" + (",season" if self.sport == "basketball" else "")
                    if buffer:
                        self.db.upsert(self.conf["h2h_table"], buffer, on_conflict=cols)
                    
                    self.save_state(current_abs_index + len(chunk))
                    logger.info(f"💾 Step {current_abs_index + len(chunk)}/{len(all_pairs)} | Saved {len(buffer)}")
                    buffer = []
                except Exception as e:
                    logger.error(f"❌ DB Upsert Error: {e}")

        await self.client.aclose()
        logger.info("🏁 Terminé.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sport", type=str, required=True, choices=["football", "basketball"])
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()
    
    ingestor = H2HIngestor(args.sport, args.limit, args.reset)
    try:
        asyncio.run(ingestor.run())
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    main()
