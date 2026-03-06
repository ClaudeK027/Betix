# ⚙️ BETIX — Documentation Technique Exhaustive du Backend

> **Avertissement pour les développeurs** : Ce document est la source de vérité absolue pour l'architecture backend de BETIX. L'architecture a été pensée autour d'une philosophie asynchrone, distribuée et "unitaire". Ne modifiez jamais un orchestrateur sans comprendre l'impact sur les scripts unitaires qu'il appelle.

---

## 🏗️ 1. Architecture et Philosophie

Le backend BETIX n'est pas une API monolithique traditionnelle. C'est un **écosystème de workers et de pipelines de données** construits autour de Python (FastAPI/Scripts autonomes) et d'une base de données Supabase, agissant comme le système nerveux central.

### Philosophie "Unitaire"
Chaque script dans `scripts/updates/` ou `app/engine/` est conçu pour faire **une seule chose de manière résiliente**. Par exemple, mettre à jour le H2H d'un match précis.
Ces scripts unitaires sont ensuite appelés par des **Pipelines** (pour enchaîner les actions), qui sont elles-mêmes déclenchées par des **Orchestrateurs** (ou radars) basés sur des règles d'affaires (temps, état du match).

### FastAPI (`app/main.py`)
Bien qu'il y ait un serveur FastAPI, son rôle actuel est mineur comparé aux workers. Il expose quelques endpoints pour forcer dynamiquement des updates (`/api/v1/trigger/...`) sans avoir à se connecter en SSH au serveur.

### Le Data Layer (Supabase)
Toute la logique repose sur Supabase.
- **Schéma `public`** : Gère les utilisateurs, les abonnements, et la data exposée au frontend (ex: `ai_match_audits`).
- **Schéma `analytics`** : Le véritable moteur de calcul. Contient les tables de RAW data (matchs, cotes, stats) et de données calculées (rolling, h2h, elo).
- **Table critique `system_config`** : Située dans `analytics`, elle sert de panneau de configuration en direct. Les orchestrateurs la lisent avant de s'allumer, permettant de couper l'IA ou d'activer le mode maintenance sans redéployer le code.

---

## 🔑 2. Configuration et Moteur

### Variables d'Environnement Cruciales
Le projet repose sur la présence stricte de variables définies dans `.env` :
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` : **Critique**. Ne jamais exposer la clé `service_role`. Le backend manipule les schémas via cette clé pour contourner le RLS (Row Level Security).
- `API_SPORTS_KEY` / `API_TENNIS_KEY` : Clés pour l'ingestion de la data. Elles sont lourdement sollicitées par les workers.
- `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` : Pour le moteur IA.
- `DEBUG` et `ENVIRONMENT` : Configurent le niveau de verbosité.

---

## 🧠 3. Les Trois Orchestrateurs (Le Cerveau)

Situés à la racine de `scripts/updates/`, ce sont des scripts persistants (ou à lancer via CRON/APScheduler). Ils lient l'ensemble du système.

### `orchestrator_data.py` (L'Horloger Quotidien)
- **Rôle** : S'assurer que la base de données est à jour sur le long terme.
- **Actions** :
  1. Lance `DiscoverMatches` : Cherche de nouveaux matchs sur les API (J-5 à J+10).
  2. Lance `DailyMatchOrchestrator` (`process_daily_matches.py`) : Scanne l'intégralité des matchs "non-finis" dans une large fenêtre pour rattraper les reports ou bugs système.
  3. Lance `OddsIngester` (`upsert_odds.py`) : Télécharge en batch les cotes pour les jours à venir.
- **Fréquence** : Conçu pour s'exécuter 1 ou 2 fois par jour.

### `orchestrator.py` (L'Opérateur Temps Réel)
- **Rôle** : Piloter la machine d'état des matchs de bout en bout ("Live Management").
- **Actions** : Compose `ImminentRadar`, `LiveSwitchRadar` et `LiveMatchMonitor`.
- **Fréquence** : Tourne en permanence avec des boucles asynchrones courtes (2 à 15 min).

### `orchestrator_ai.py` (Le Planificateur Cognitif)
- **Rôle** : Distribuer la charge de calcul des LLMs pour ne pas exploser les coûts ou les Rate Limits.
- **Mécanique** :
  Il lit dans `system_config` à quelle heure il doit déclencher les batchs d'IA pour chaque sport. S'il est l'heure, il appelle `batch_audit_next_days.py` (via `subprocess`).

---

## ⚙️ 4. La Machine d'État et le Live (Radars)

L'évolution du cycle de vie d'un match (scheduled -> imminent -> live -> finished) est vitale. Sans cette transition, les pipelines de fin de match et le calcul de la 'Rolling Form' ne se déclenchent pas.

### 1. `mark_imminent.py` (Radar H-3)
- Identifie les matchs avec statut `scheduled` commençant dans moins de 3 heures.
- Vérifie leur statut exact auprès des API via les **Upserters**.
- Passe leur statut à `imminent` en base.
- S'ils sont curieusement "finished" (ex: Walkover au Tennis), déclenche immédiatement leur pipeline.

### 2. `mark_live.py` (Radar M-5)
- Traque les matchs `imminent` dans les 5 minutes précédant le coup d'envoi.
- Passe le statut à `live`.

### 3. `monitor_live.py` (Suivi en direct)
- Traque les matchs `live`.
- **Action répétitive** : Appelle l'API toutes les 2-3 minutes via les Upserters pour mettre à jour le score (table matchs).
- **Le moment clé** : Lorsque l'API renvoie le statut "Terminé" (FT, AET, etc.), il capture le score final et **déclenche la pipeline de fin de match** asynchrone (`pipeline_fb.py` ou `pipeline_tennis.py`).

### 4. `process_daily_matches.py` (Le Filet de Sécurité)
- Si un match a échappé aux radars live (panne du serveur, bug de l'API sport), ce script le rattrape. Il prend une fenêtre de J-10 à J+10, prend tous les matchs `neq.finished`, et vérifie leur statut. S'ils sont terminés, il déclenche les pipelines.

---

## 🛠️ 5. Les Upserters (Normalisation et Ingestion)

Ces classes abstraient complètement la complexité des API externes (différences de JSON, de clés existantes/inexistantes).

### `upsert_fb_data.py` (Football & Basketball)
- **Statuts** : Normalise les dizaines de statuts de l'API-Sports en 5 statuts BETIX : `scheduled`, `imminent`, `live`, `finished`, `postponed`.
- **Scores** : Fusionne de façon robuste les scores. Ex: `match["goals"]["home"]` en Foot devient `home_score`.

### `upsert_tennis_data.py`
- Gère la complexité du tennis (pas d'heure précise de match, dépend du précédent sur le court).
- Tente de relocaliser un match sur J-1, J+1, J+2 si l'API le déplace silencieusement.
- S'occupe de compter les `sets_played` pour jauger la fatigue physique des joueurs.

### `upsert_odds.py`
- Récupère les cotes pre-match (Match Winner, Over/Under, BTTS).
- Fonctionne par batchs de 50 pour éviter le Time-Out de l'API.
- Écrit dans `odds_snapshots`. **L'IA lira le snapshot le plus récent au moment de l'audit.**

---

## 🏭 6. Les Pipelines de Fin de Match (Calculs Analytiques)

Quand un match est signalé "Finished" par un radar, on doit recalculer toutes ses conséquences sur la dynamique de la saison. C'est le rôle des pipelines (`pipeline_fb.py` et `pipeline_tennis.py`).

Elles exécutent dans un ordre **strict et asynchrone** (via `subprocess`) :

1. **`update_match_stats.py` / `update_tennis_stats.py`**
   - Va chercher les statistiques détaillées du match (Possession, xG, Aces, Pourcentages aux Tirs, etc.) et les enregistre dans les tables `_match_stats`.
2. **`update_match_h2h.py` / `update_tennis_h2h.py`**
   - Recalcule l'historique commun (Face-à-face) des deux adversaires. Les compteurs de victoires et les moyennes de buts mutuels sont mis à jour en tenant compte du match qui vient de se terminer.
3. **`update_match_rolling.py` / `update_tennis_rolling.py`**
   - **Le cœur du système**. Ce script recalcule la dynamique des équipes concernées : "Last 5" (L5), "Last 10" (L10), la fatigue, les différentiels (Net Rating, xG diff).
   - Ces métriques roulantes sont sauvegardées dans les tables `_team_rolling` ou `_player_rolling`, à la date du jour. Ce point fixe permettra à l'IA d'analyser le prochain match de l'équipe avec ses stats à jour.

---

## 🤖 7. Le Moteur d'Intelligence Artificielle (AI Engine)

Le processus de prédiction est conçu pour être asynchrone et archivé.

### Lancer un Batch : `batch_audit_next_days.py`
Ce script est appelé par l'orchestrateur. Il cherche les matchs des 3 prochains jours ayant des cotes, et ne traite que les matchs **pas encore audités pour le cycle actuel (run_id)**. S'il rencontre des erreurs `429 Too Many Requests`, il possède un "Circuit Breaker" interne et s'arrête proprement.

### Le Script de Résolution Unitaire : `match_audit_script.py`
Ce script cordonne l'audit d'un match précis.
1. **Appel à `data_aggregation.py`** : Cette classe va chercher les informations du match dans une quinzaine de tables Supabase (Match info, cotes, H2H, rolling stats Home, rolling stats Away, stats arbitrage, etc.) et compile un énorme dictionnaire de contexte.
2. **Filtrage** : Il extrait les `essential_stats` pour qu'elles puissent être stockées en base dans la table `ai_match_audits` sans exploser la taille du JSON.
3. **Prompt et Génération** (`confidence_generator.py` & `ai_model.py`) : Envoie les données aggrégées et textuelles à l'API LLM (Anthropic ou Gemini) en utilisant le prompt spécifique du sport (défini dans `prompt_builder.py`).
4. **Mise en Base** : Upsert le JSON de l'IA (analyse et indice de confiance) dans la table `public.ai_match_audits`. Le Frontend pourra alors l'afficher.

---

## 📖 8. Guide d'Intervention pour Développeur

La granularité du projet permet d'intervenir à différents endroits sans rien casser.

**1. Comment forcer la mise à jour des stats d'un seul match défaillant ?**
Si le live monitor a crashé, exécutez simplement les scripts manuellement :
```bash
python scripts/updates/update_match_stats.py --sport football --match-id 112233
python scripts/updates/update_match_rolling.py --sport football --match-id 112233
```
*Le script est agnostique du moment, tant que le statut est "finished" en DB.*

**2. Comment modifier le comportement de l'IA ?**
- **Pour modifier ce qu'on donne à l'IA (Les données)** : Modifiez `app/engine/data_aggregation.py`. Si vous ajoutez une nouvelle colonne en DB, c'est ici qu'il faut l'extraire et l'ajouter au dictionnaire.
- **Pour modifier comment l'IA réfléchit (Le ton, la structure)** : Modifiez `app/engine/prompt_builder.py`.
- **Pour changer le format de sortie métier** : Modifiez le schéma Pydantic `BetixResponseFormat` dans `prompt_builder.py`.

**3. Comment ajouter l'API pour un nouveau sport sportif (ex: Hockey) ?**
1. Créer une classe `HockeyMatchUpserter` dans `scripts/updates/upsert_hockey_data.py` (Copiez celle du basket).
2. Ajouter le sport dans les dictionnaires cibles (ex: dans `process_daily_matches.py`).
3. Créer une `pipeline_hockey.py` (copiez `pipeline_fb.py`).
4. Écrire le Data Context dans `data_aggregation.py`.
5. Ajouter le System Prompt dans `prompt_builder.py`.

**4. Dépannage du Live**
Si les matchs restent coincés en `live`, vérifiez l'état de `monitor_live.py`. Vous pouvez toujours corriger un match bloqué via votre panneau Supabase natif en le passant en `finished`, mais **n'oubliez pas de déclencher sa pipeline manuellement** après, sinon les stats (et la Rolling Form des équipes) ne se mettront pas à jour.
