"""
BETIX — Modèles de données partagés.
Structures normalisées pour les 3 sports (Football, Basketball, Tennis).
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


# --- Enums ---

class Sport(str, Enum):
    FOOTBALL = "football"
    BASKETBALL = "basketball"
    TENNIS = "tennis"


class MatchStatus(str, Enum):
    SCHEDULED = "scheduled"
    IMMINENT = "imminent"
    LIVE = "live"
    FINISHED = "finished"
    POSTPONED = "postponed"


class ConfidenceLevel(str, Enum):
    SAFE = "safe"
    INTERMEDIATE = "intermediate"
    RISKY = "risky"


class FactorImpact(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


# --- Données sportives ---

class League(BaseModel):
    """Compétition / Ligue / Tournoi."""
    id: int
    name: str
    logo: str = ""
    country: str = ""
    country_flag: str = ""


class Participant(BaseModel):
    """Équipe ou joueur."""
    id: int
    name: str
    logo: str = ""


class Score(BaseModel):
    """Score d'un match."""
    home: int
    away: int
    details: Optional[dict] = None  # Mi-temps foot, quarts basket, sets tennis


class Match(BaseModel):
    """Match normalisé — structure commune aux 3 sports."""
    id: str
    external_id: str
    sport: Sport

    league: League
    home: Participant
    away: Participant

    date: str  # ISO 8601
    timestamp: int
    status: MatchStatus

    score: Optional[Score] = None


# --- Prédictions ---

class KeyFactor(BaseModel):
    """Facteur clé de l'analyse."""
    icon: str
    label: str
    description: str
    impact: FactorImpact


class Prediction(BaseModel):
    """Prédiction IA pour un match."""
    id: str
    match_id: str
    sport: Sport

    confidence_level: ConfidenceLevel

    analysis: str  # Texte explicatif complet (markdown)
    predicted_outcome: str  # Ex: "Victoire domicile", "Over 2.5"
    predicted_score: Optional[str] = None  # Ex: "2-1"
    odds_value: Optional[float] = None  # Cote associée

    key_factors: list[KeyFactor] = []

    model_used: str = ""
    generated_at: str = ""  # ISO 8601


# --- Contexte pour le prompt IA ---

class Standing(BaseModel):
    """Position au classement."""
    rank: int
    points: int
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int = 0
    goals_against: int = 0


class H2HResult(BaseModel):
    """Résultat d'une confrontation directe."""
    date: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    league: str = ""


class Injury(BaseModel):
    """Joueur blessé / indisponible."""
    player_name: str
    reason: str
    status: str = ""  # Doubtful, Out, etc.


class MatchAnalysisContext(BaseModel):
    """Contexte complet pour l'analyse IA d'un match."""
    match: Match

    home_form: list[str] = []  # ["W","W","D","L","W"]
    away_form: list[str] = []

    home_standing: Optional[Standing] = None
    away_standing: Optional[Standing] = None

    h2h: list[H2HResult] = []

    home_stats: dict = {}
    away_stats: dict = {}

    home_injuries: list[Injury] = []
    away_injuries: list[Injury] = []

    odds: Optional[dict] = None
