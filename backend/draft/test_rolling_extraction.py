import asyncio
import json
import logging
import sys
import os
from typing import Dict, Any

# Ajout du backend au path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.engine.data_aggregation import get_match_context

# On définit localement la fonction pour éviter d'importer match_audit_script.py (qui crash à cause de l'IA)
def filter_essential_stats_local(sport: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Filtre le contexte pour ne garder que les statistiques 'maîtresses' 
    afin d'alléger l'archive JSON tout en gardant la substance de l'audit.
    """
    filtered = {
        "home": {},
        "away": {}
    }
    
    # Mapping des stats clés par sport
    keys_by_sport = {
        "basketball": ["l5_ortg", "l5_drtg", "l5_net_rtg", "l5_pace", "l5_efg_pct", "l10_ortg", "l10_drtg"],
        "football": ["l5_goals_for", "l5_goals_against", "l5_xg_for", "l5_xg_against", "l5_possession_avg", "l5_points"],
        "tennis": ["l10_aces_avg", "l10_first_serve_pct", "l10_first_serve_won", "l10_bp_saved_pct", "l10_return_won_pct", "l10_bp_converted_pct"]
    }
    
    keys = keys_by_sport.get(sport, [])
    
    # On récupère le "global" (all venues) du dernier snapshot rolling
    for side in ["home", "away"]:
        # Pour le basket/foot : "home_team" / "away_team"
        # Pour le tennis : "player1" / "player2"
        side_key = f"{side}_team" if sport != "tennis" else ("player1" if side == "home" else "player2")
        
        raw_form = context.get(side_key, {}).get("form", {}).get("global", [])
        if not raw_form and sport == "tennis":
            # Tennis a une structure légèrement différente dans l'agrégateur
            raw_form = context.get(side_key, {}).get("form", {}).get("overall", [])
            
        if raw_form:
            latest = raw_form[0] # Le plus récent (index 0 car ordonné par date desc dans l'agrégateur)
            filtered[side] = {k: latest.get(k) for k in keys if k in latest}
            filtered[side]["date"] = latest.get("date")

    return filtered

async def test_sport_extraction(sport, match_id):
    print(f"\n" + "="*50)
    print(f" TESTING {sport.upper()} Match #{match_id}")
    print("="*50)
    
    # 1. Récupérer le contexte
    try:
        context = await get_match_context(sport, match_id)
    except Exception as e:
        print(f"[ERROR] Erreur lors de get_match_context: {e}")
        return

    if not context or not context.get("match"):
        print(f"[ERROR] Aucun contexte trouvé pour {sport} #{match_id}")
        return

    # 2. Extraire les stats filtrées
    filtered = filter_essential_stats_local(sport, context)
    
    # 3. Afficher les résultats
    print("\n[RESULTATS FILTRES ENREGISTRES DANS AI_MATCH_AUDITS]")
    print(json.dumps(filtered, indent=2))
    
    # 4. Diagnostic approfondi
    keys_by_sport = {
        "basketball": ["l5_ortg", "l5_drtg", "l5_net_rtg", "l5_pace", "l5_efg_pct", "l10_ortg", "l10_drtg"],
        "football": ["l5_goals_for", "l5_goals_against", "l5_xg_for", "l5_xg_against", "l5_possession_avg", "l5_points"],
        "tennis": ["l10_aces_avg", "l10_first_serve_pct", "l10_first_serve_won", "l10_bp_saved_pct", "l10_return_won_pct", "l10_bp_converted_pct"]
    }
    expected_keys = keys_by_sport.get(sport, [])

    for side in ["home", "away"]:
        side_key = f"{side}_team" if sport != "tennis" else ("player1" if side == "home" else "player2")
        form_dict = context.get(side_key, {}).get("form", {})
        
        print(f"\n--- Details {side_key} ---")
        if not form_dict:
            print(f"WARN: Aucun dictionnaire 'form' pour {side_key}")
            continue

        for fkey in ["global", "overall", "home", "away"]:
            data = form_dict.get(fkey, [])
            if data:
                print(f"Form '{fkey}' : {len(data)} snapshots trouves. Dernier le {data[0].get('date')}")
                # Vérifier la présence des clés attendues dans le dernier snapshot de cette catégorie
                missing = [k for k in expected_keys if k not in data[0]]
                if missing:
                    print(f"   MISSING: Cles MANQUANTES dans '{fkey}': {missing}")
                else:
                    print(f"   OK: Toutes les cles ({len(expected_keys)}) sont presentes dans '{fkey}'.")
            else:
                print(f"   (L'entree '{fkey}' est vide)")

async def main():
    # Liste des matchs à tester (IDs internes valides trouvés en DB)
    tests = [
        ("football", 1321),
        ("basketball", 4385),
        ("tennis", 3076)
    ]
    
    for sport, mid in tests:
        await test_sport_extraction(sport, mid)

if __name__ == "__main__":
    asyncio.run(main())
