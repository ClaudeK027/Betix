-- =============================================================================
-- CLEANUP: RESET ANALYTICS DATA
-- =============================================================================
-- Description:
-- Truncates analytics tables to remove old 2023 test data before
-- importing fresh 2025 production data.
-- Cascades to dependent tables (matches, players, etc.)
-- =============================================================================

TRUNCATE TABLE analytics.football_matches CASCADE;
TRUNCATE TABLE analytics.basketball_matches CASCADE;
TRUNCATE TABLE analytics.players CASCADE;
TRUNCATE TABLE analytics.teams CASCADE;
TRUNCATE TABLE analytics.leagues CASCADE;

-- Optional: Clear public matches to stay in sync
TRUNCATE TABLE public.matches CASCADE;
