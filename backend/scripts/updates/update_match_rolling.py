"""
BETIX — update_match_rolling.py
Mise à jour ciblée des Rolling Stats (Séries) pour UN match spécifique.
Recalcule les stats (L5, L10, etc.) pour les deux équipes impliquées, à la date du match.

Usage :
    python update_match_rolling.py --sport football --match-id 123456
    python update_match_rolling.py --sport basketball --match-id 456789
"""

import asyncio
import argparse
import logging
import sys
import os
from datetime import datetime, timedelta

# Ajout du chemin pour les imports app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.config import get_settings
from app.services.ingestion.base_client import SupabaseREST

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s — %(message)s")
logger = logging.getLogger("betix.update_rolling")

class SingleMatchRollingUpdater:
    def __init__(self, sport: str):
        self.sport = sport
        settings = get_settings()
        self.db = SupabaseREST(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY, schema="analytics")
        self.match_table = "football_matches" if sport == "football" else "basketball_matches"
        self.rolling_table = "football_team_rolling" if sport == "football" else "basketball_team_rolling"

    async def get_match_details(self, match_id: int):
        rows = self.db.select(
            self.match_table, 
            "id,api_id,home_team_id,away_team_id,date_time,home_score,away_score", 
            {"api_id": match_id}
        )
        return rows[0] if rows else None

    async def get_team_history(self, team_id: int, before_date: str, limit: int = 20):
        """Récupère les N derniers matchs de l'équipe AVANT la date donnée."""
        # On doit récupérer les matchs où l'équipe joue
        # Supabase complex filtering : or=(home_team_id.eq.X,away_team_id.eq.X) AND date_time.lt.DATE
        # Simplification : on fait une query raw
        # Correction de la syntaxe pour le filtre 'or' + 'and'
        # Supabase raw query : or=(home_team_id.eq.787,away_team_id.eq.787)&date_time=lt.2023...
        # Il faut s'assurer que les parenthèses sont bien gérées.
        # Parfois, un espace ou un caractère spécial casse tout.
        
        # DATE ENCODING FIX:
        # The '+' in '2023-01-01T12:00:00+00:00' is treated as a space by URL decoders.
        # We must replace it with '%2B' OR use urllib.parse.quote.
        # Here we manually replace '+' with '%2B' for safety.
        safe_date = before_date.replace("+", "%2B")

        # On construit la query string manuellement et proprement
        query = (
            f"select=id,api_id,home_team_id,away_team_id,home_score,away_score,date_time&"
            f"or=(home_team_id.eq.{team_id},away_team_id.eq.{team_id})&"
            f"date_time=lt.{safe_date}&"
            f"status=eq.finished&"
            f"order=date_time.desc&"
            f"limit={limit}"
        )
        # Enlever les sauts de ligne potentiels qui cassent l'URL
        query = query.replace("\n", "").replace(" ", "")
        
        rows = self.db.select_raw(self.match_table, query)
        # Remettre dans l'ordre chronologique pour le calcul
        return sorted(rows, key=lambda x: x["date_time"])

    def compute_football_stats(self, team_id: int, match_date: str, venue: str, history: list):
        # Logique inspirée de compute_rolling.py
        # history est chronologique (le plus vieux en premier)
        
        last_5 = history[-5:]
        if len(last_5) < 2: return None # Pas assez de données

        points = 0
        goals_for = 0
        goals_against = 0
        clean_sheets = 0
        
        for pm in last_5:
            is_home = pm["home_team_id"] == team_id
            gf = (pm.get("home_score") or 0) if is_home else (pm.get("away_score") or 0)
            ga = (pm.get("away_score") or 0) if is_home else (pm.get("home_score") or 0)
            
            goals_for += gf
            goals_against += ga
            
            if ga == 0: clean_sheets += 1
            
            if gf > ga: points += 3
            elif gf == ga: points += 1
            
        n = len(last_5)
        
        # On calcule les stats "L5" (Last 5)
        return {
            "team_id": team_id,
            "date": match_date[:10], # YYYY-MM-DD
            "venue": venue,
            "l5_points": points,
            "l5_ppm": round(points / n, 2),
            "l5_goals_for": round(goals_for / n, 1),
            "l5_goals_against": round(goals_against / n, 1),
            "l5_clean_sheets": clean_sheets
        }

    def compute_basketball_stats(self, team_id: int, match_date: str, venue: str, history: list):
        # Logique Basic (Fatigue)
        # history est chronologique
        
        match_dt = datetime.fromisoformat(match_date.replace("Z", "+00:00"))
        
        # Rest Days & B2B
        rest_days = None
        is_b2b = False
        
        if history:
            last_match = history[-1]
            last_dt = datetime.fromisoformat(last_match["date_time"].replace("Z", "+00:00"))
            diff = match_dt - last_dt
            rest_days = diff.days
            is_b2b = rest_days <= 1

        # Games in last 7 days
        seven_days_ago = match_dt - timedelta(days=7)
        games_in_7 = sum(1 for m in history if datetime.fromisoformat(m["date_time"].replace("Z", "+00:00")) >= seven_days_ago)

        return {
            "team_id": team_id,
            "date": match_date[:10],
            "venue": venue,
            "rest_days": rest_days,
            "is_b2b": is_b2b,
            "games_in_7_days": games_in_7
        }

    async def update(self, match_id: int):
        logger.info(f"📈 Update Rolling for Match {match_id} ({self.sport})")
        
        match = await self.get_match_details(match_id)
        if not match:
            logger.error("❌ Match introuvable.")
            return

        date_time = match["date_time"]
        teams = [
            {"id": match["home_team_id"], "venue": "home"},
            {"id": match["away_team_id"], "venue": "away"}
        ]
        
        rows_to_upsert = []

        for t in teams:
            tid = t["id"]
            venue = t["venue"]
            
            # Récupérer l'historique AVANT ce match
            history = await self.get_team_history(tid, date_time)
            
            # Calculer pour le contexte spécifique (Home/Away) et Global (All)
            contexts = [venue, "all"]
            
            for ctx in contexts:
                # Filtrer l'historique si on est en mode Home/Away strict
                # Note: compute_rolling.py fait ça aussi. 
                # Global = tout l'historique. Venue = historique filtré par venue.
                # Simplification ici : on garde tout l'historique pour le calcul,
                # mais le script original filtre l'historique par venue POUR le calcul L5 venue.
                
                filtered_hist = history
                if ctx != "all":
                    filtered_hist = [m for m in history if (m["home_team_id"] == tid) == (ctx == "home")]
                
                if self.sport == "football":
                    row = self.compute_football_stats(tid, date_time, ctx, filtered_hist)
                else:
                    row = self.compute_basketball_stats(tid, date_time, ctx, filtered_hist) # Basketball fatigue uses global history mostly
                
                if row:
                    rows_to_upsert.append(row)

        if rows_to_upsert:
            self.db.upsert(self.rolling_table, rows_to_upsert, on_conflict="team_id,date,venue")
            logger.info(f"✅ Rolling Stats Updated: {len(rows_to_upsert)} entries.")
            # print(rows_to_upsert) # Debug
        else:
            logger.warning("⚠️ Aucune donnée Rolling générée (manque d'historique ?)")

async def main():
    parser = argparse.ArgumentParser(description="Update specific match Rolling Stats")
    parser.add_argument("--sport", choices=["football", "basketball"], required=True)
    parser.add_argument("--match-id", type=int, required=True)
    args = parser.parse_args()
    
    updater = SingleMatchRollingUpdater(args.sport)
    await updater.update(args.match_id)

if __name__ == "__main__":
    asyncio.run(main())
