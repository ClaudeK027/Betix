-- 08_add_stadium_and_reset.sql
-- Ajouter le champ stadium et vider les tables matchs pour ré-importation complète.
-- EXÉCUTÉ PAR L'UTILISATEUR LE 2026-02-14.

ALTER TABLE analytics.football_matches ADD COLUMN IF NOT EXISTS stadium text;
ALTER TABLE analytics.basketball_matches ADD COLUMN IF NOT EXISTS stadium text;

TRUNCATE TABLE analytics.football_match_stats CASCADE;
TRUNCATE TABLE analytics.basketball_match_stats CASCADE;
TRUNCATE TABLE analytics.football_matches CASCADE;
TRUNCATE TABLE analytics.basketball_matches CASCADE;
