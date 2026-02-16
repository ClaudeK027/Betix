"""
BETIX — Router Predictions
Endpoints pour récupérer les prédictions IA d'un match.
Retourne des données mock pour la Phase 1.
"""

from fastapi import APIRouter
from app.models.schemas import ConfidenceLevel

router = APIRouter()


# =============================================================================
# DONNÉES MOCK — Seront remplacées par les prédictions IA en Phase 4
# =============================================================================

MOCK_PREDICTIONS: dict[str, list[dict]] = {
    "fb-001": [
        {
            "id": "pred-fb001-safe",
            "match_id": "fb-001",
            "sport": "football",
            "confidence_level": "safe",
            "analysis": """## Analyse Prudente — Manchester United vs Liverpool

Les deux équipes affichent une forme récente contrastée. **Manchester United** reste sur 3 victoires consécutives à domicile, avec une défense qui n'a encaissé que 2 buts sur cette période. **Liverpool**, bien que leader du championnat, a montré des signes de fragilité en déplacement lors des dernières semaines.

Le facteur Old Trafford pèse lourd : United a remporté 7 de ses 10 derniers matchs à domicile toutes compétitions confondues. La confrontation directe historique montre un équilibre, mais l'avantage du terrain devrait faire la différence.

**Recommandation : Double chance 1X (Manchester United ou Nul)**""",
            "predicted_outcome": "Double chance 1X",
            "predicted_score": "1-1",
            "odds_value": 1.45,
            "key_factors": [
                {"icon": "🏟️", "label": "Avantage domicile", "description": "7 victoires sur 10 à Old Trafford", "impact": "positive"},
                {"icon": "🛡️", "label": "Solidité défensive", "description": "2 buts encaissés en 3 matchs à domicile", "impact": "positive"},
                {"icon": "📊", "label": "H2H équilibré", "description": "3V-2N-5D sur les 10 derniers face-à-face", "impact": "neutral"},
            ],
            "model_used": "gemini-2.0-flash",
            "generated_at": "2026-02-11T08:00:00+00:00",
        },
        {
            "id": "pred-fb001-inter",
            "match_id": "fb-001",
            "sport": "football",
            "confidence_level": "intermediate",
            "analysis": """## Analyse Intermédiaire — Manchester United vs Liverpool

L'analyse des statistiques avancées (xG, possession dans le dernier tiers) suggère un match ouvert avec des buts. Les deux équipes ont marqué dans **6 des 8 derniers derbies**. United a un xG moyen de 1.8 à domicile cette saison, tandis que Liverpool affiche 2.1 en déplacement.

La tendance aux buts est forte : 75% des matchs de United à domicile ont vu plus de 2.5 buts cette saison. Liverpool a marqué au minimum 1 but dans chacun de ses 12 derniers déplacements.

**Recommandation : Les deux équipes marquent (BTTS Oui)**""",
            "predicted_outcome": "BTTS Oui",
            "predicted_score": "2-1",
            "odds_value": 1.72,
            "key_factors": [
                {"icon": "⚽", "label": "Tendance BTTS", "description": "6/8 derniers derbies avec les 2 équipes qui marquent", "impact": "positive"},
                {"icon": "📈", "label": "xG élevé", "description": "xG combiné de 3.9 par match en moyenne", "impact": "positive"},
                {"icon": "🔥", "label": "Forme offensive Liverpool", "description": "Au moins 1 but en 12 déplacements consécutifs", "impact": "negative"},
            ],
            "model_used": "gemini-2.0-flash",
            "generated_at": "2026-02-11T08:00:00+00:00",
        },
        {
            "id": "pred-fb001-risky",
            "match_id": "fb-001",
            "sport": "football",
            "confidence_level": "risky",
            "analysis": """## Analyse Risquée — Manchester United vs Liverpool

En allant plus loin dans l'analyse, le profil de jeu de Manchester United à domicile (pressing haut, transitions rapides) combiné à l'agressivité offensive de Liverpool crée un terreau fertile pour un match à score élevé.

Sur les 5 derniers Manchester United vs Liverpool à Old Trafford, le score moyen est de **2.6 - 1.8**. Si United adopte son schéma habituel en 4-3-3 avec Bruno Fernandes en meneur, les espaces laissés pourraient profiter aux deux camps.

**Recommandation : Score exact 2-1 pour Manchester United**""",
            "predicted_outcome": "Score exact 2-1 (Man Utd)",
            "predicted_score": "2-1",
            "odds_value": 8.50,
            "key_factors": [
                {"icon": "🎯", "label": "Score exact fréquent", "description": "2-1 est le score le plus fréquent à Old Trafford cette saison", "impact": "positive"},
                {"icon": "⚠️", "label": "Risque élevé", "description": "Les scores exacts restent difficiles à prédire", "impact": "negative"},
                {"icon": "💰", "label": "Cote attractive", "description": "8.50 offre un excellent ratio risque/rendement", "impact": "positive"},
            ],
            "model_used": "gemini-2.0-flash",
            "generated_at": "2026-02-11T08:00:00+00:00",
        },
    ],
}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/{match_id}")
async def get_predictions(match_id: str):
    """Récupère les 3 niveaux de prédiction pour un match."""
    predictions = MOCK_PREDICTIONS.get(match_id, [])

    if not predictions:
        return {
            "match_id": match_id,
            "available": False,
            "message": "Les prédictions pour ce match ne sont pas encore disponibles.",
            "predictions": [],
        }

    return {
        "match_id": match_id,
        "available": True,
        "predictions": predictions,
    }
