"""
BETIX - sync_public.py
Lightweight sync: propagates mutable field changes from analytics.*_matches
to public.matches so the frontend sees updated data in real time.

Only syncs fields that change during match lifecycle:
  - date_time, status, status_short, score (tennis), home_score/away_score (fb/basket)
"""

import logging
from app.services.ingestion.base_client import SupabaseREST
from app.services.ingestion.constants import ANALYTICS_TO_PUBLIC_STATUS

logger = logging.getLogger("betix.sync_public")

# Extend the mapping to include imminent
_STATUS_MAP = {**ANALYTICS_TO_PUBLIC_STATUS, "imminent": "imminent"}


def sync_match_to_public(
    analytics_db: SupabaseREST,
    sport: str,
    api_id: int,
    analytics_payload: dict,
):
    """
    After updating an analytics.*_matches row, call this to propagate
    the changed fields to public.matches.

    analytics_payload: the dict of fields that were updated in analytics
                       (same keys as the analytics table columns).
    """
    public_db = SupabaseREST(
        analytics_db.base_url.replace("/rest/v1", ""),
        analytics_db.headers["apikey"],
        schema="public",
    )

    public_payload = {}

    # --- date_time ---
    if "date_time" in analytics_payload:
        public_payload["date_time"] = analytics_payload["date_time"]

    # --- status ---
    if "status" in analytics_payload:
        analytics_status = analytics_payload["status"]
        public_payload["status"] = _STATUS_MAP.get(analytics_status, "upcoming")

    # --- status_short ---
    if "status_short" in analytics_payload:
        public_payload["status_short"] = analytics_payload["status_short"]

    # --- score (football / basketball) ---
    if "home_score" in analytics_payload or "away_score" in analytics_payload:
        # We need current score to build the JSON object
        # Fetch current public row to merge
        try:
            rows = public_db.select_raw(
                "matches",
                f"select=score&api_sport_id=eq.{api_id}&sport=eq.{sport}"
            )
            current_score = rows[0].get("score") if rows else None
            if current_score is None:
                current_score = {}
            new_score = {**current_score}
            if "home_score" in analytics_payload:
                new_score["home"] = analytics_payload["home_score"]
            if "away_score" in analytics_payload:
                new_score["away"] = analytics_payload["away_score"]
            public_payload["score"] = new_score
        except Exception as e:
            logger.warning(f"Could not sync score for {sport} {api_id}: {e}")

    # --- score (tennis: display string + sets_played) ---
    if "score" in analytics_payload or "sets_played" in analytics_payload:
        try:
            rows = public_db.select_raw(
                "matches",
                f"select=score&api_sport_id=eq.{api_id}&sport=eq.{sport}"
            )
            current_score = rows[0].get("score") if rows else None
            if current_score is None:
                current_score = {}
            new_score = {**current_score}
            if "score" in analytics_payload:
                new_score["display"] = analytics_payload["score"]
            if "sets_played" in analytics_payload:
                new_score["sets_played"] = analytics_payload["sets_played"]
            public_payload["score"] = new_score
        except Exception as e:
            logger.warning(f"Could not sync tennis score for {sport} {api_id}: {e}")

    if not public_payload:
        return

    try:
        public_db.update(
            "matches",
            public_payload,
            {"api_sport_id": str(api_id), "sport": sport},
        )
        logger.debug(f"Public sync {sport} {api_id}: {list(public_payload.keys())}")
    except Exception as e:
        logger.warning(f"Public sync failed for {sport} {api_id}: {e}")
