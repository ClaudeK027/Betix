---
description: Méthode DAR pour la résolution du problème critique des Rolling Stats vides (Foot/Basket)
---

# Workflow : Résolution du Bug des Rolling Stats Vides

Ce workflow suit la méthode **DAR** (Diagnostic - Ablation - Reconstruction) pour corriger l'absence systématique de statistiques de séries (calculées via `update_match_rolling.py`) sur les nouveaux matchs de Football et Basketball.

## 🩺 1. Diagnostic (D)
- [ ] **Audit des données sources** : Vérifier si `football_match_stats` et `basketball_match_stats` sont populées pour les matchs terminés récents.
- [ ] **Audit du pipeline** : Vérifier si l'orchestrateur lance bien `update_match_stats.py` AVANT `update_match_rolling.py`.
- [ ] **Verification des Logs** : Analyser les sorties d'erreurs lors de l'exécution automatique (B2B, missing keys, etc.).
- [ ] **Identification de la cause racine** : Est-ce un manque de données API, une erreur de calcul ou un problème d'ordre d'exécution ?

## ✂️ 2. Ablation (A)
- [ ] **Suppression des données corrompues/vides** : Identifier les entrées `null` dans `football_team_rolling` et `basketball_team_rolling` pour les 7 derniers jours.
- [ ] **Patch des scripts** : Isoler et supprimer les segments de code obsolètes ou erronés (ex: mauvaises clés de dictionnaire, filtres de date incorrects).

## 🏗️ 3. Reconstruction (R)
- [ ] **Mise à jour des formules** :
    - [ ] Football : Ajouter xG, possession, goals avg.
    - [ ] Basketball : Ajouter ORTG, DRTG, Pace, eFG%.
- [ ] **Synchronisation des IDs** : S'assurer que tous les scripts utilisent l'ID API (api_id) pour la cohérence.
- [ ] **Backfill manuel** : Relancer les calculs sur les 48h passées pour restaurer l'intégrité de la base.
- [ ] **Test de non-régression** : Utiliser `scripts/draft/test_rolling_extraction.py` pour valider les nouveaux matchs.

## 🚀 4. Validation (V)
- [ ] Vérifier dans `ai_match_audits` que les nouveaux audits ne contiennent plus de `null`.
- [ ] Confirmer l'affichage correct dans l'onglet "Stats" du frontend.
