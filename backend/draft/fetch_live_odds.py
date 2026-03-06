"""
BETIX — Script prototype : récupération des cotes Bet365
Interroge les 3 APIs sportives pour extraire les marchés ciblés.

Structure des réponses API (validée par diagnostic) :
- Football : response[0].bookmakers[].bets[].values[]
- Basketball : idem (Bet365 absent → fallback Pinnacle/1xBet)
- Tennis : result{match_key: {market: {outcome: {bookmaker: cote}}}}
"""
import asyncio
import httpx
import json
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.config import get_settings

# ─── Configuration ─────────────────────────────────────────────
FOOTBALL_FIXTURE_ID = 1379229       # Match avec cotes Bet365 confirmé
BASKETBALL_GAME_ID = 470281        # Match NBA avec cotes confirmé
TENNIS_MATCH_KEY = 12104660        # Match tennis simple avec cotes Bet365

PREFERRED_BOOKIE_NAME = "Bet365"
PREFERRED_BOOKIE_ID = 8            # Football only

# Fallback bookmakers pour le basket (Bet365 non disponible)
BASKETBALL_FALLBACK = ["Pinnacle", "1xBet", "Betfair"]

# 8 marchés ciblés Football
FOOTBALL_MARKETS = [
    "Match Winner",         # 1x2
    "Goals Over/Under",     # Totals
    "Both Teams Score",     # BTTS
    "Double Chance",
    "Exact Score",          # Correct Score (nom API réel)
    "Asian Handicap",
    "HT/FT Double",        # Half Time / Full Time (nom API réel)
    "First Half Winner"
]

# 5 marchés ciblés Basketball
BASKETBALL_MARKETS = [
    "Home/Away",            # Moneyline (incl OT)
    "Asian Handicap",       # Spread
    "Over/Under",           # Game Totals
    "Over/Under 1st Half",  # 1st Half Totals
    "Home/Away - 1st Half"  # 1st Half Winner
]

# 5 marchés ciblés Tennis (noms exacts depuis l'API)
TENNIS_MARKETS = [
    "Home/Away",            # Match Winner
    "Set Betting",          # Score en Sets
    "Over/Under",           # Total de Jeux (structure spéciale)
    "Home/Away (1st Set)",  # 1er Set Winner
    "Correct Score 1st Half"# Score exact 1er set
]


class OddsPrototype:
    def __init__(self):
        s = get_settings()
        self.api_sports_key = s.API_SPORTS_KEY
        self.api_tennis_key = s.API_TENNIS_KEY

    # ─── Football ─────────────────────────────────────────────
    async def fetch_football(self, client: httpx.AsyncClient) -> dict:
        """Récupère les cotes Football via API-Sports v3."""
        print("\n🏟️  FOOTBALL — Fetching odds...")
        headers = {"x-apisports-key": self.api_sports_key}
        resp = await client.get(
            "https://v3.football.api-sports.io/odds",
            headers=headers,
            params={"fixture": FOOTBALL_FIXTURE_ID, "bookmaker": PREFERRED_BOOKIE_ID}
        )
        resp.raise_for_status()
        data = resp.json().get("response", [])
        
        if not data:
            print("   ❌ No data returned")
            return {}
        
        bookmakers = data[0].get("bookmakers", [])
        if not bookmakers:
            print("   ❌ No bookmakers found")
            return {}
        
        bookie = bookmakers[0]
        bets = bookie.get("bets", [])
        
        result = {}
        for target_market in FOOTBALL_MARKETS:
            market_data = next((b for b in bets if b["name"] == target_market), None)
            if market_data:
                values = market_data.get("values", [])
                result[target_market] = [
                    {"label": str(v["value"]), "odds": float(v["odd"])} 
                    for v in values
                ]
            else:
                result[target_market] = None
        
        return result

    # ─── Basketball ───────────────────────────────────────────
    async def fetch_basketball(self, client: httpx.AsyncClient) -> dict:
        """Récupère les cotes Basketball via API-Sports v1.
        Bet365 n'est pas disponible → on utilise un fallback."""
        print("\n🏀 BASKETBALL — Fetching odds...")
        headers = {"x-apisports-key": self.api_sports_key}
        resp = await client.get(
            "https://v1.basketball.api-sports.io/odds",
            headers=headers,
            params={"game": BASKETBALL_GAME_ID}
        )
        resp.raise_for_status()
        data = resp.json().get("response", [])
        
        if not data:
            print("   ❌ No data returned")
            return {}
        
        bookmakers = data[0].get("bookmakers", [])
        
        # Chercher Bet365 d'abord, puis fallback
        bookie = None
        for name in [PREFERRED_BOOKIE_NAME] + BASKETBALL_FALLBACK:
            bookie = next(
                (b for b in bookmakers if name.lower() in b["name"].lower()), 
                None
            )
            if bookie:
                break
        
        if not bookie:
            print("   ❌ No suitable bookmaker found")
            return {}
        
        print(f"   📌 Using bookmaker: {bookie['name']}")
        bets = bookie.get("bets", [])
        
        result = {}
        for target_market in BASKETBALL_MARKETS:
            market_data = next((b for b in bets if b["name"] == target_market), None)
            if market_data:
                values = market_data.get("values", [])
                result[target_market] = [
                    {"label": str(v["value"]), "odds": float(v["odd"])} 
                    for v in values
                ]
            else:
                result[target_market] = None
        
        return result

    # ─── Tennis ───────────────────────────────────────────────
    async def fetch_tennis(self, client: httpx.AsyncClient) -> dict:
        """Récupère les cotes Tennis via API-Tennis.
        Structure différente: result[match_key][market][outcome][bookmaker] = cote
        """
        print("\n🎾 TENNIS — Fetching odds...")
        today = datetime.now().strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        resp = await client.get(
            "https://api.api-tennis.com/tennis/",
            params={
                "method": "get_odds",
                "date_start": today,
                "date_stop": tomorrow,
                "APIkey": self.api_tennis_key
            }
        )
        resp.raise_for_status()
        data = resp.json()
        all_matches = data.get("result", {})
        
        match_key = str(TENNIS_MATCH_KEY)
        if match_key not in all_matches:
            # Si le match exact n'est pas trouvé, prendre le premier disponible
            if all_matches:
                match_key = list(all_matches.keys())[0]
                print(f"   ⚠️ Match {TENNIS_MATCH_KEY} non trouvé, fallback sur {match_key}")
            else:
                print("   ❌ No matches with odds available")
                return {}
        
        match_odds = all_matches[match_key]
        
        result = {}
        for target_market in TENNIS_MARKETS:
            market_data = match_odds.get(target_market)
            if not market_data or not isinstance(market_data, dict):
                result[target_market] = None
                continue
            
            # Extraire la cote bet365 pour chaque outcome
            values = []
            for outcome_name, bookies_or_thresholds in market_data.items():
                if not isinstance(bookies_or_thresholds, dict):
                    continue
                
                # Déterminer si c'est un dict de bookmakers ({"bet365": "1.50"})
                # ou un dict de seuils ({"2.5": {"bet365": "1.50"}})
                first_val = next(iter(bookies_or_thresholds.values()), None)
                
                if isinstance(first_val, dict):
                    # Structure à 3 niveaux : outcome → seuil → bookmaker → cote
                    # Ex: "Over/Under Over" → {"2.5": {"bwin": "1.50", "bet365": "1.55"}}
                    for threshold, bookies in bookies_or_thresholds.items():
                        if isinstance(bookies, dict):
                            odd = bookies.get("bet365")
                            if odd is None:
                                odd = next(iter(bookies.values()), None)
                            if odd:
                                label = f"{outcome_name} {threshold}"
                                values.append({"label": label, "odds": float(odd)})
                else:
                    # Structure à 2 niveaux : outcome → bookmaker → cote
                    # Ex: "Home" → {"bet365": "2.50", "bwin": "2.40"}
                    odd = bookies_or_thresholds.get("bet365")
                    if odd is None:
                        odd = next(iter(bookies_or_thresholds.values()), None)
                    if odd:
                        try:
                            values.append({"label": outcome_name, "odds": float(odd)})
                        except (ValueError, TypeError):
                            pass
            
            result[target_market] = values if values else None
        
        return result

    # ─── Runner ───────────────────────────────────────────────
    async def run(self):
        print("="*60)
        print("  BETIX — Prototype Odds Fetcher (Bet365)")
        print("="*60)
        
        results = {}
        async with httpx.AsyncClient(timeout=30.0) as client:
            results["football"] = await self.fetch_football(client)
            await asyncio.sleep(1)
            results["basketball"] = await self.fetch_basketball(client)
            await asyncio.sleep(1)
            results["tennis"] = await self.fetch_tennis(client)
        
        # ── Rapport ──
        print("\n" + "="*60)
        print("  📊 EXTRACTION REPORT")
        print("="*60)
        
        sport_configs = {
            "football": ("🏟️", FOOTBALL_MARKETS),
            "basketball": ("🏀", BASKETBALL_MARKETS),
            "tennis": ("🎾", TENNIS_MARKETS),
        }
        
        for sport, (icon, expected) in sport_configs.items():
            data = results.get(sport, {})
            found = sum(1 for m in expected if data.get(m) is not None)
            print(f"\n{icon} {sport.upper()} — {found}/{len(expected)} markets")
            
            for market in expected:
                odds = data.get(market)
                if odds is None:
                    print(f"   ⭕ {market}: NOT FOUND")
                else:
                    preview = " | ".join(f"{o['label']}={o['odds']}" for o in odds[:4])
                    if len(odds) > 4:
                        preview += f" ... (+{len(odds)-4})"
                    print(f"   ✅ {market}: {preview}")


if __name__ == "__main__":
    proto = OddsPrototype()
    asyncio.run(proto.run())
