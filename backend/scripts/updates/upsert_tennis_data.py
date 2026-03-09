import logging
from datetime import datetime, timezone
import httpx

logger = logging.getLogger("draft.tennis_upsert")

class TennisMatchUpserter:
    def __init__(self, db_client, api_key: str):
        self.db = db_client
        self.api_key = api_key
        self._http_client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Retourne un client HTTP partagé."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=15.0)
        return self._http_client

    async def close(self):
        """Ferme proprement le client HTTP."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()
            self._http_client = None

    async def process_match(self, db_match: dict) -> bool:
        """
        Traite un match spécifique : Fetch API -> Parse -> Diff -> Update DB.
        Retourne True si le match traité est considéré comme 'finished', False sinon.
        """
        api_id = db_match["api_id"]
        db_id = db_match["id"]
        
        # 1. FETCH API
        raw = await self._fetch_api_data(db_match)
        if not raw:
            # Si le match est introuvable ET son heure est dépassée de >6h → cancelled
            match_dt_str = db_match.get("date_time", "")
            is_overdue = False
            if match_dt_str:
                try:
                    dt = datetime.fromisoformat(match_dt_str.replace("Z", "+00:00"))
                    hours_past = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
                    is_overdue = hours_past > 6
                except (ValueError, TypeError):
                    pass

            if is_overdue and db_match["status"] not in ("finished", "cancelled"):
                logger.warning(f"   ⚠️ Match {api_id} (DB: {db_id}) introuvable sur l'API et dépassé de >6h → cancelled.")
                try:
                    self.db.update("tennis_matches", {"status": "cancelled", "status_short": "Annulé"}, {"api_id": api_id})
                except Exception as e:
                    logger.error(f"   ❌ Erreur DB cancel {api_id}: {e}")
                return False
            else:
                logger.warning(f"   ⚠️ Match {api_id} (DB: {db_id}) introuvable sur l'API.")
                return db_match["status"] == "finished"
            
        # 2. PARSING ROBUSTE
        parsed_data = self._parse_api_payload(raw, db_match)
        
        # 3. DIFF & UPDATE
        updated = self._apply_update_if_needed(api_id, db_match, parsed_data)
        
        return parsed_data["status"] == "finished"

    async def _fetch_api_data(self, db_match: dict) -> dict | None:
        api_id = db_match["api_id"]
        # Récupération de la date depuis la DB pour cibler l'API
        db_date_str = db_match["date_time"][:10] if db_match.get("date_time") else datetime.utcnow().strftime("%Y-%m-%d")
        
        from datetime import timedelta
        
        try:
            base_date = datetime.strptime(db_date_str, "%Y-%m-%d")
            client = await self._get_client()
            
            # P5: Optimisation - tester d'abord la date théorique exacte (i=0)
            # Si introuvable, chercher autour (-1, -2, 1, 2, 3, 4) car le tennis glisse souvent
            search_offsets = [0, -1, 1, -2, 2, 3, 4]
            
            for i in search_offsets:
                target_date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
                url = f"https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey={self.api_key}&event_key={api_id}&date_start={target_date}&date_stop={target_date}"
                
                resp = await client.get(url)
                resp.raise_for_status()
                data = resp.json().get("result", [])
                
                if data:
                    match_data = next((m for m in data if str(m.get("event_key")) == str(api_id)), None)
                    if match_data:
                        if i != 0:
                            logger.info(f"   ⚠️ Match {api_id} trouvé décalé sur le {target_date} (DB: {db_date_str}, offset: {i}j)")
                        return match_data
            
            return None # Introuvable sur 7 jours
        except Exception as e:
            logger.error(f"Erreur HTTP lors de la récupération du match {api_id}: {e}")
            return None

    def _parse_api_payload(self, raw: dict, db_match: dict) -> dict:
        """Applique l'algorithme robuste de parsing pour le Tennis.
        Utilise une normalisation du status API pour éviter les mismatches (ex: 'Walk Over' vs 'Walkover').
        """
        
        # --- A. TEMPS (Date & Heure) ---
        event_date = raw.get("event_date", "")
        event_time = raw.get("event_time", "")
        
        new_date_str = db_match.get("date_time")
        if event_date and event_time and event_time != "":
            new_date_str = f"{event_date}T{event_time}:00Z"
            
        # --- B. STATUS (avec normalisation) ---
        raw_status = raw.get("event_status", "")
        # API-Tennis renvoie parfois des codes numériques au lieu de texte
        # "1" = Not Started, "2" = In Progress, "3" = Finished, "6" = Postponed, "7" = Cancelled
        NUMERIC_STATUS_MAP = {"1": "notstarted", "2": "live", "3": "finished", "4": "postponed",
                              "5": "cancelled", "6": "postponed", "7": "cancelled", "8": "walkover", "0": "notstarted"}
        if raw_status in NUMERIC_STATUS_MAP:
            raw_status = NUMERIC_STATUS_MAP[raw_status]
        normalized = raw_status.lower().replace(" ", "").replace("-", "")  # "Walk Over" -> "walkover"
        
        is_live = str(raw.get("event_live", "0")) == "1"
        winner = raw.get("event_winner")
        final_res = raw.get("event_final_result", "")
        
        # Calculer le status par défaut dynamiquement au lieu de préserver aveuglément
        # Si le match est dans les 3 prochaines heures → imminent, sinon → scheduled
        new_status = "scheduled"
        if new_date_str:
            try:
                match_dt = datetime.fromisoformat(new_date_str.replace("Z", "+00:00"))
                hours_until = (match_dt - datetime.now(timezone.utc)).total_seconds() / 3600
                if 0 <= hours_until <= 3:
                    new_status = "imminent"
            except (ValueError, TypeError):
                pass

        # Sets de statuts normalisés pour classification robuste
        FINISHED_STATUSES = {"finished"}
        DECIDED_STATUSES = {"walkover", "retired", "abandoned", "cancelled", "defaulted"}
        POSTPONED_STATUSES = {"postponed", "delayed", "suspended", "interrupted"}
        LIVE_KEYWORDS = {"set", "tiebreak", "game", "live"}
        
        # Règle 1: Fin absolue (score normal OU vainqueur prononcé)
        if normalized in FINISHED_STATUSES or (winner and final_res and final_res != "-"):
            new_status = "finished"
            
        # Règle 2: Match décidé sans score classique (walkover, retired, etc.)
        elif normalized in DECIDED_STATUSES:
            new_status = "finished"  # Considéré comme terminé car un vainqueur est désigné
            
        # Règle 3: Vainqueur désigné (filet de sécurité ultime)
        elif winner:
            new_status = "finished"
            logger.info(f"   🔒 Match {db_match.get('api_id')}: Vainqueur détecté ('{winner}') avec status API '{raw_status}' → forced finished.")
            
        # Règle 4: Report / Suspension
        elif normalized in POSTPONED_STATUSES:
            new_status = "postponed"
            
        # Règle 5: Direct (Live)
        elif any(kw in normalized for kw in LIVE_KEYWORDS) or is_live:
            new_status = "live"
            
        # Règle 6: Status inconnu → Warning + force cancelled si match dépassé
        elif raw_status and normalized not in {"", "notstarted", "scheduled"}:
            logger.warning(f"   ⚠️ STATUS API NON RECONNU pour match {db_match.get('api_id')}: '{raw_status}' (normalisé: '{normalized}'). Vérifier la liste des statuts.")
            # Si le match est dépassé de >6h avec un statut inconnu, on le force en cancelled
            match_dt_str = db_match.get("date_time", "")
            if match_dt_str:
                try:
                    dt = datetime.fromisoformat(match_dt_str.replace("Z", "+00:00"))
                    hours_past = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
                    if hours_past > 6:
                        new_status = "cancelled"
                        logger.info(f"   🔒 Match {db_match.get('api_id')}: Status inconnu '{raw_status}' + dépassé >6h → forced cancelled.")
                except (ValueError, TypeError):
                    pass
            
        # --- C. SCORE & SETS ---
        score = None
        if final_res and final_res != "-" and final_res != "":
            score = final_res
            
        sets_played = 0
        raw_scores = raw.get("scores", [])
        if isinstance(raw_scores, list) and len(raw_scores) > 0:
            first_set = raw_scores[0]
            if first_set.get("score_first") == "0" and first_set.get("score_second") == "0" and len(raw_scores) == 1:
                sets_played = 0
            else:
                sets_played = len(raw_scores)
                
        # P6: Normaliser status_short pour affichage frontend cohérent
        STATUS_DISPLAY = {
            "finished": "Terminé",
            "walkover": "W.O.",
            "retired": "Abandon",
            "abandoned": "Abandon",
            "cancelled": "Annulé",
            "defaulted": "Forfait",
            "postponed": "Reporté",
            "delayed": "Retardé",
            "suspended": "Suspendu",
            "interrupted": "Interrompu",
            "notstarted": "",
            "scheduled": "",
        }
        display_status = STATUS_DISPLAY.get(normalized, raw_status)
        
        # Si live, garder le statut brut (ex: "Set 2", "Tiebreak")
        if new_status == "live":
            display_status = raw_status
        
        return {
            "status": new_status,
            "status_short": display_status,
            "date_time": new_date_str,
            "score": score,
            "sets_played": sets_played
        }

    def _apply_update_if_needed(self, api_id: int, db_match: dict, parsed: dict) -> bool:
        """Compare et applique l'update si les valeurs diffèrent. Retourne True si modifié."""
        payload = {}
        
        if parsed["status"] != db_match.get("status"):
            payload["status"] = parsed["status"]
            
        # Comparaison de date sécurisée (ignorer None vs None)
        old_date = db_match.get("date_time")
        new_date = parsed["date_time"]
        if new_date and old_date and new_date[:16] != old_date[:16]:
            payload["date_time"] = new_date
            
        if parsed["score"] != db_match.get("score"):
            payload["score"] = parsed["score"]
            
        if parsed["sets_played"] != db_match.get("sets_played"):
            payload["sets_played"] = parsed["sets_played"]
            
        if not payload:
            logger.info(f"   💤 Match {api_id}: Aucun changement détecté.")
            return False
            
        try:
            self.db.update("tennis_matches", payload, {"api_id": api_id})
            updates_str = ", ".join([f"{k}={v}" for k, v in payload.items()])
            logger.info(f"   ✅ Match {api_id} mis à jour : {updates_str}")
            return True
        except Exception as e:
            logger.error(f"   ❌ Erreur DB lors de l'update de {api_id} : {e}")
            return False
