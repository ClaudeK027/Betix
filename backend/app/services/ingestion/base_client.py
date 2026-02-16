"""
BETIX — BaseSportClient
Classe abstraite pour l'ingestion des données sportives.
Fournit les méthodes communes : appel API, UPSERT, logging, sync vers public.
Chaque sport (Football, Basketball) hérite et implémente ses transformations.

NOTE: Uses raw httpx + Supabase PostgREST API instead of the supabase-py SDK
to avoid the SDK's blocking Realtime WebSocket connection during batch jobs.
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional

import httpx

from app.config import get_settings
from .constants import ANALYTICS_TO_PUBLIC_STATUS, CURRENT_SEASON

logger = logging.getLogger("betix.ingestion")


class SupabaseREST:
    """
    Lightweight Supabase PostgREST client using httpx.
    Supports schema selection via Accept-Profile / Content-Profile headers.
    """

    def __init__(self, url: str, service_role_key: str, schema: str = "public") -> None:
        self.base_url = f"{url}/rest/v1"
        self.schema = schema
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Profile": schema,
            "Content-Profile": schema,
            "Prefer": "return=representation",
        }

    def upsert(self, table: str, data: list[dict], on_conflict: str) -> list[dict]:
        """UPSERT rows into a table. Returns upserted rows."""
        if not data:
            return []
        headers = {
            **self.headers,
            "Prefer": f"return=representation,resolution=merge-duplicates",
        }
        url = f"{self.base_url}/{table}?on_conflict={on_conflict}"
        resp = httpx.post(url, headers=headers, json=data, timeout=30.0)
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase UPSERT Error: {e.response.text}")
            raise
        return resp.json()

    def insert(self, table: str, data: dict) -> dict:
        """INSERT a single row. Returns the inserted row."""
        headers = {**self.headers, "Prefer": "return=representation"}
        url = f"{self.base_url}/{table}"
        resp = httpx.post(url, headers=headers, json=data, timeout=15.0)
        resp.raise_for_status()
        result = resp.json()
        return result[0] if result else {}

    def update(self, table: str, data: dict, filters: dict[str, Any]) -> list[dict]:
        """UPDATE rows. Returns the updated rows."""
        headers = {**self.headers, "Prefer": "return=representation"}
        url = f"{self.base_url}/{table}?"
        if filters:
            for col, val in filters.items():
                url += f"{col}=eq.{val}&"
        url = url.rstrip("&")
        
        resp = httpx.patch(url, headers=headers, json=data, timeout=15.0)
        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"Supabase UPDATE Error: {e.response.text}")
            raise
        return resp.json()

    def select(
        self, table: str, columns: str = "*", filters: dict[str, Any] | None = None, limit: int | None = None
    ) -> list[dict]:
        """SELECT rows from a table with optional filters."""
        url = f"{self.base_url}/{table}?select={columns}"
        if filters:
            for col, val in filters.items():
                url += f"&{col}=eq.{val}"
        if limit:
            url += f"&limit={limit}"
        resp = httpx.get(url, headers=self.headers, timeout=15.0)
        resp.raise_for_status()
        return resp.json()

    def select_raw(self, table: str, query_params: str) -> list[dict]:
        """SELECT rows using a raw PostgREST query string."""
        url = f"{self.base_url}/{table}?{query_params}"
        resp = httpx.get(url, headers=self.headers, timeout=15.0)
        resp.raise_for_status()
        return resp.json()

    def delete(self, table: str, filters: dict[str, Any]) -> None:
        """DELETE rows based on filters."""
        url = f"{self.base_url}/{table}?"
        if filters:
            for col, val in filters.items():
                # postgrest format: col=eq.val or col=gt.val
                # if val contains ".", assume operator is included (e.g. "gt.0")
                if "." in str(val):
                     url += f"{col}={val}&"
                else:
                     url += f"{col}=eq.{val}&"
        url = url.rstrip("&")
        
        resp = httpx.delete(url, headers=self.headers, timeout=15.0)
        resp.raise_for_status()


class BaseSportClient(ABC):
    """
    Client d'ingestion abstrait.
    Chaque sport doit implémenter les méthodes _transform_* et _build_public_match.
    """

    # --- Attributs abstraits à définir dans les sous-classes ---
    sport: str = ""
    base_url: str = ""
    league_ids: dict[int, dict] = {}
    status_map: dict[str, str] = {}

    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = settings.API_SPORTS_KEY

        # Client REST pour le schéma analytics.*
        self.analytics = SupabaseREST(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            schema="analytics",
        )

        # Client REST pour le schéma public.*
        self.public = SupabaseREST(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            schema="public",
        )

        # Client HTTP pour les appels API-Sports
        self.http = httpx.AsyncClient(
            base_url=f"https://{self.base_url}",
            headers={"x-apisports-key": self.api_key},
        )

        # Cache interne pour les mappings api_id -> internal_id
        self._league_id_map: dict[int, int] = {}  # api_id -> internal db id
        self._team_id_map: dict[int, int] = {}  # api_id -> internal db id
        self._request_count = 0

    # =========================================================================
    # API CALL (avec rate-limit guard)
    # =========================================================================
    async def _api_get(self, endpoint: str, params: dict | None = None) -> dict:
        """
        Appel GET à l'API-Sports avec gestion du compteur de requêtes.
        Lève une exception si le quota est proche (>90 requêtes).
        """
        if self._request_count >= 7000:
            msg = f"[{self.sport}] Quota guard: {self._request_count} requests used, stopping (Pro limit: 7500/day)."
            logger.warning(msg)
            self._log("warning", msg)
            raise RuntimeError(msg)

        try:
            resp = await self.http.get(endpoint, params=params)
            self._request_count += 1
            resp.raise_for_status()
            data = resp.json()

            # API-Sports wraps errors in the response body
            if data.get("errors") and len(data["errors"]) > 0:
                error_detail = str(data["errors"])
                logger.error(f"[{self.sport}] API error on {endpoint}: {error_detail}")
                self._log("error", f"API error on {endpoint}: {error_detail}")
                return {"response": []}

            return data

        except httpx.TimeoutException:
            msg = f"[{self.sport}] Timeout on {endpoint}"
            logger.error(msg)
            self._log("error", msg)
            return {"response": []}

        except httpx.HTTPStatusError as e:
            msg = f"[{self.sport}] HTTP {e.response.status_code} on {endpoint}: {e.response.text}"
            logger.error(msg)
            self._log("error", msg)
            return {"response": []}

    # =========================================================================
    # LOGGING
    # =========================================================================
    def _log(self, level: str, message: str) -> None:
        """Insert a log entry into public.system_logs."""
        try:
            self.public.insert("system_logs", {
                "level": level,
                "source": f"ingestion-{self.sport}",
                "message": message,
            })
        except Exception as e:
            logger.error(f"Failed to write system_log: {e}")

    # =========================================================================
    # CACHES D'IDs (api_id -> internal_id)
    # =========================================================================
    def _load_league_id_map(self) -> None:
        """
        Charge le mapping api_id -> id pour les ligues de ce sport.
        À appeler APRÈS l'ingestion des ligues.
        """
        rows = self.analytics.select("leagues", "id,api_id", {"sport": self.sport})
        self._league_id_map = {r["api_id"]: r["id"] for r in rows}

    def _load_team_id_map(self) -> None:
        """
        Charge le mapping api_id -> id pour les équipes de ce sport.
        À appeler APRÈS l'ingestion des équipes.
        """
        rows = self.analytics.select("teams", "id,api_id", {"sport": self.sport})
        self._team_id_map = {r["api_id"]: r["id"] for r in rows}

    # =========================================================================
    # INGESTION : LIGUES
    # =========================================================================
    async def ingest_leagues(self) -> int:
        """
        Ingère les ligues ciblées dans analytics.leagues.
        Retourne le nombre de ligues insérées/mises à jour.
        """
        logger.info(f"[{self.sport}] Ingesting {len(self.league_ids)} leagues...")

        if not self._team_id_map: self._load_team_id_map()
        if not self._league_id_map: self._load_league_id_map()

        rows = []
        for api_id, meta in self.league_ids.items():
            data = await self._api_get(self._get_leagues_endpoint(), {"id": api_id})
            items = data.get("response", [])
            if items:
                transformed = self._transform_league(items[0], meta)
                rows.append(transformed)
            await asyncio.sleep(0.5)  # Rate limit courtesy

        if rows:
            self.analytics.upsert("leagues", rows, "api_id,sport")

        self._load_league_id_map()

        msg = f"[{self.sport}] Leagues: {len(rows)} upserted."
        logger.info(msg)
        self._log("info", msg)
        return len(rows)

    # =========================================================================
    # INGESTION : ÉQUIPES
    # =========================================================================
    async def ingest_teams(self) -> int:
        """
        Ingère les équipes de toutes les ligues ciblées dans analytics.teams.
        Retourne le nombre d'équipes insérées/mises à jour.
        """
        if not self._league_id_map:
            self._load_league_id_map()

        all_rows: list[dict] = []

        for api_league_id, internal_league_id in self._league_id_map.items():
            logger.info(f"[{self.sport}] Fetching teams for league api_id={api_league_id}...")
            params = self._get_teams_params(api_league_id)
            data = await self._api_get(self._get_teams_endpoint(), params)
            items = data.get("response", [])
            for item in items:
                transformed = self._transform_team(item, internal_league_id)
                all_rows.append(transformed)

            await asyncio.sleep(1.0)  # Rate limit

        if all_rows:
            # Batch upsert to avoid 500/timeout issues
            batch_size = 50
            for i in range(0, len(all_rows), batch_size):
                batch = all_rows[i:i+batch_size]
                self.analytics.upsert("teams", batch, "api_id,sport")
                logger.debug(f"[{self.sport}] Batched upsert: {i+len(batch)}/{len(all_rows)}")

        self._load_team_id_map()

        msg = f"[{self.sport}] Teams: {len(all_rows)} upserted."
        logger.info(msg)
        self._log("info", msg)
        return len(all_rows)

    # =========================================================================
    # INGESTION : MATCHS
    # =========================================================================
    async def ingest_matches(self, date: str) -> int:
        """
        Ingère les matchs d'une date donnée dans la table analytics spécifique.
        Puis synchronise vers public.matches.
        Args:
            date: Format "YYYY-MM-DD"
        Returns:
            Nombre de matchs insérés/mis à jour.
        """
        if not self._team_id_map:
            self._load_team_id_map()
        if not self._league_id_map:
            self._load_league_id_map()

        all_analytics_rows: list[dict] = []
        all_public_rows: list[dict] = []

        for api_league_id in self.league_ids.keys():
            logger.info(
                f"[{self.sport}] Fetching matches for league {api_league_id} on {date}..."
            )
            data = await self._api_get(
                self._get_matches_endpoint(),
                self._get_matches_params(api_league_id, date),
            )
            items = data.get("response", [])

            for item in items:
                analytics_row = self._transform_match(item)
                if analytics_row:
                    all_analytics_rows.append(analytics_row)

            await asyncio.sleep(1.0)

        # UPSERT into analytics table
        if all_analytics_rows:
            self.analytics.upsert(
                self._get_analytics_matches_table(),
                all_analytics_rows,
                "api_id",
            )

            # Build public.matches from the analytics rows
            for row in all_analytics_rows:
                public_row = self._build_public_match(row)
                if public_row:
                    all_public_rows.append(public_row)

        # UPSERT into public.matches
        if all_public_rows:
            self.public.upsert("matches", all_public_rows, "api_sport_id,sport")

        msg = (
            f"[{self.sport}] Matches on {date}: "
            f"{len(all_analytics_rows)} analytics, {len(all_public_rows)} public."
        )
        logger.info(msg)
        self._log("info", msg)
        return len(all_analytics_rows)

    # =========================================================================
    def _get_live_match_api_ids_from_db(self) -> list[int]:
        """
        Récupère les API IDs des matchs qui sont 'live' 
        en interrogeant la table analytics propre au sport (source de vérité).
        """
        table = self._get_analytics_matches_table()
        query = "select=api_id&status=eq.live"
        
        print(f"DEBUG: [{self.sport}] Searching IDs in {table} with query: {query}")
        
        try:
            # On cherche dans le schema analytics
            rows = self.analytics.select_raw(table, query)
            ids = [int(r["api_id"]) for r in rows if r.get("api_id")]
            print(f"DEBUG: [{self.sport}] Found IDs: {ids}")
            return ids
        except Exception as e:
            logger.error(f"[{self.sport}] Failed to get live match IDs from analytics DB: {e}")
            print(f"DEBUG: [{self.sport}] ERROR: {e}")
            return []

    async def ingest_live_matches(self) -> int:
        """
        Ingère uniquement les matchs EN DIRECT (ou censés l'être) basés sur la DB.
        Met à jour analytics.*_matches et public.matches.
        """
        if not self._team_id_map:
            self._load_team_id_map()
        if not self._league_id_map:
            self._load_league_id_map()

        # 1. Get relevant match IDs from DB
        target_ids = self._get_live_match_api_ids_from_db()
        
        if not target_ids:
            logger.info(f"[{self.sport}] No live/pending matches found in DB to refresh.")
            return 0

        logger.info(f"[{self.sport}] Refreshing {len(target_ids)} matches from API...")
        
        # 2. Parallel calls to API (using the new endpoints interface)
        endpoints = self._get_matches_by_ids_endpoints(target_ids)
        all_analytics_rows: list[dict] = []
        all_public_rows: list[dict] = []

        async def _fetch_batch(endpoint):
            try:
                data = await self._api_get(endpoint)
                items = data.get("response", [])
                batch_rows = []
                for item in items:
                    analytics_row = self._transform_match(item)
                    if analytics_row:
                        batch_rows.append(analytics_row)
                    else:
                        fixture_id = item.get("fixture", {}).get("id") or item.get("id")
                        logger.debug(f"[{self.sport}] Refresh: match {fixture_id} skipped by transform.")
                return batch_rows
            except Exception as e:
                logger.error(f"[{self.sport}] Error refreshing endpoint {endpoint}: {e}")
                return []

        # Execute all fetches in parallel
        results = await asyncio.gather(*[_fetch_batch(ep) for ep in endpoints])
        for res in results:
            all_analytics_rows.extend(res)

        # 3. Upsert Results
        if all_analytics_rows:
            # UPSERT analytics
            self.analytics.upsert(
                self._get_analytics_matches_table(),
                all_analytics_rows,
                "api_id",
            )
            # UPSERT public
            for row in all_analytics_rows:
                public_row = self._build_public_match(row)
                if public_row:
                    all_public_rows.append(public_row)

            if all_public_rows:
                self.public.upsert("matches", all_public_rows, "api_sport_id,sport")

        msg = f"[{self.sport}] Live Refresh: {len(all_public_rows)} matches updated (Targeted: {len(target_ids)})."
        logger.info(msg)
        self._log("info", msg)
        return len(all_public_rows)

    # =========================================================================
    # MÉTHODES ABSTRAITES — À implémenter par chaque sport
    # =========================================================================
    async def fetch_live_data_only(self) -> list[dict]:
        """
        [DEBUG] Extrait et transforme les données live de l'API sans persister en base.
        Utile pour vérifier les scores/status avant d'activer l'écriture.
        """
        if not self._team_id_map:
            self._load_team_id_map()
        if not self._league_id_map:
            self._load_league_id_map()

        target_ids = self._get_live_match_api_ids_from_db()
        if not target_ids:
            return []

        all_transformed: list[dict] = []
        batch_size = 20

        # On prépare les appels API. Certains sports supportent le batch (Football),
        # d'autres non (Basketball v1).
        endpoints: list[str] = self._get_matches_by_ids_endpoints(target_ids)
        
        async def _fetch_one(endpoint):
            try:
                data = await self._api_get(endpoint)
                items = data.get("response", [])
                transformed = []
                for item in items:
                    analytics_row = self._transform_match(item)
                    if analytics_row:
                        transformed.append({
                            "api_id": analytics_row.get("api_id"),
                            "status": analytics_row.get("status"),
                            "score": analytics_row.get("score") or {
                                "home": analytics_row.get("home_score"),
                                "away": analytics_row.get("away_score")
                            },
                            "teams": {
                                "home": analytics_row.get("home_team_name") or "Team A",
                                "away": analytics_row.get("away_team_name") or "Team B"
                            }
                        })
                return transformed
            except Exception as e:
                logger.error(f"[{self.sport}] Error fetching {endpoint}: {e}")
                return []

        # On lance tous les appels en parallèle (limité par le quota)
        results = await asyncio.gather(*[_fetch_one(ep) for ep in endpoints])
        for res in results:
            all_transformed.extend(res)

        return all_transformed

    def _get_matches_by_ids_endpoints(self, ids: list[int]) -> list[str]:
        """
        Génère une liste d'endpoints pour récupérer les matchs par IDs.
        Par défaut, tente de faire un batch (recommandé).
        """
        ids_str = "-".join(map(str, ids))
        return [f"{self._get_matches_endpoint()}?ids={ids_str}"]

    def _get_leagues_endpoint(self) -> str:
        """Endpoint API pour récupérer les ligues."""
        ...

    @abstractmethod
    def _get_teams_endpoint(self) -> str:
        """Endpoint API pour récupérer les équipes."""
        return "/teams"

    @abstractmethod
    def _get_teams_params(self, league_api_id: int) -> dict:
        """Paramètres pour la requête de récupération des équipes."""
        ...

    @abstractmethod
    def _get_matches_endpoint(self) -> str:
        """Endpoint API pour récupérer les matchs."""
        ...

    @abstractmethod
    def _get_matches_params(self, league_api_id: int, date: str) -> dict:
        """Paramètres pour la requête de matchs."""
        ...

    @abstractmethod
    def _get_live_matches_endpoint(self) -> str:
        """Endpoint API pour récupérer les matchs en direct."""
        ...

    @abstractmethod
    def _get_analytics_matches_table(self) -> str:
        """Nom de la table analytics pour les matchs de ce sport."""
        ...

    @abstractmethod
    def _transform_league(self, raw: dict, meta: dict) -> dict:
        """Transforme la réponse API en ligne analytics.leagues."""
        ...

    @abstractmethod
    def _transform_team(self, raw: dict, internal_league_id: int) -> dict:
        """Transforme la réponse API en ligne analytics.teams."""
        ...

    @abstractmethod
    def _transform_match(self, raw: dict) -> Optional[dict]:
        """Transforme la réponse API en ligne analytics.*_matches."""
        ...

    @abstractmethod
    def _build_public_match(self, analytics_row: dict) -> Optional[dict]:
        """
        Construit un objet public.matches depuis une ligne analytics.
        Résout les FKs en utilisant les caches _team_id_map et _league_id_map.
        """
        ...

    # =========================================================================
    # CLEANUP
    # =========================================================================
    async def close(self) -> None:
        """Ferme le client HTTP."""
        await self.http.aclose()
