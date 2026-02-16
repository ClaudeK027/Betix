-- 09_fix_status_constraints.sql
-- Expand CHECK constraints on match status columns to include all possible API statuses.

-- Basketball: currently only allows (scheduled, live, finished)
-- Need to add: postponed, cancelled, suspended
ALTER TABLE analytics.basketball_matches
  DROP CONSTRAINT IF EXISTS basketball_matches_status_check;

ALTER TABLE analytics.basketball_matches
  ADD CONSTRAINT basketball_matches_status_check
  CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled', 'suspended'));

-- Football: currently allows (scheduled, live, finished, postponed)
-- Need to add: cancelled, abandoned
ALTER TABLE analytics.football_matches
  DROP CONSTRAINT IF EXISTS football_matches_status_check;

ALTER TABLE analytics.football_matches
  ADD CONSTRAINT football_matches_status_check
  CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled', 'abandoned'));
