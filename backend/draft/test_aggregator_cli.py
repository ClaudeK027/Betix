"""
Script CLI pour tester l'agrégateur de données (DataAggregator).
Usage: python backend/scripts/updates/test_aggregator_cli.py <sport> <match_id>
"""
import asyncio
import sys
import os
import json

# Ajout du chemin backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.engine.data_aggregation import get_match_context

async def main():
    if len(sys.argv) < 3:
        print("Usage: python test_aggregator_cli.py <sport> <match_id>")
        return

    sport = sys.argv[1]
    try:
        match_id = int(sys.argv[2])
    except ValueError:
        print("match_id doit être un entier.")
        return

    print(f"🎯 Récupération du contexte pour {sport} #{match_id}...")
    
    try:
        context = await get_match_context(sport, match_id)
        
        # Affichage structuré
        print("\n✅ Contexte récupéré avec succès.")
        print(f"   Match: {context.get('match', {}).get('date_time', 'N/A')} | {context.get('match', {}).get('status', 'N/A')}")
        
        # Cotes
        odds = context.get('odds')
        if odds:
            print(f"\n📊 Marchés Odds ({len(odds)}) :")
            for mk, data in odds.items():
                print(f"   - {mk}: {json.dumps(data['odds_data'], ensure_ascii=False)[:100]}...")
        else:
            print("\n⚠️ Aucune cote trouvée pour ce match.")
            
        # Stats / Form
        if sport == 'tennis':
            print(f"\n👤 Joueur 1: {context.get('player1', {}).get('name')} | Form: {'Stats OK' if context.get('player1', {}).get('form') else 'No stats'}")
            print(f"👤 Joueur 2: {context.get('player2', {}).get('name')} | Form: {'Stats OK' if context.get('player2', {}).get('form') else 'No stats'}")
        else:
            print(f"\n🏠 Home: {context.get('home_team', {}).get('name')} | Form: {'Stats OK' if context.get('home_team', {}).get('form') else 'No stats'}")
            print(f"🚀 Away: {context.get('away_team', {}).get('name')} | Form: {'Stats OK' if context.get('away_team', {}).get('form') else 'No stats'}")

    except Exception as e:
        print(f"❌ Erreur lors de l'agrégation : {e}")

if __name__ == "__main__":
    asyncio.run(main())
