-- -----------------------------------------------------------------------------
-- Script: 07_decouple_match_stats.sql
-- Description: Vider les tables de stats et supprimer la contrainte FK sur match_id
-- car nous allons désormais utiliser l'API ID directement comme match_id.
-- -----------------------------------------------------------------------------

-- 1. Vider les tables (RESET)
TRUNCATE TABLE analytics.football_match_stats;
TRUNCATE TABLE analytics.basketball_match_stats;

-- 2. Supprimer les contraintes de clé étrangère vers *_matches(id)
-- Football
ALTER TABLE analytics.football_match_stats
DROP CONSTRAINT IF EXISTS football_match_stats_match_id_fkey;

-- Basketball
ALTER TABLE analytics.basketball_match_stats
DROP CONSTRAINT IF EXISTS basketball_match_stats_match_id_fkey;

-- Note: On garde la FK sur team_id car les équipes existent toujours en base.
