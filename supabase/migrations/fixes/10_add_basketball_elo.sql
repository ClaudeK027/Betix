-- =============================================================================
-- MIGRATION: ADD BASKETBALL ELO
-- =============================================================================
-- Description: Adds missing ELO table for basketball to match football schema.
--              Allows tracking team strength over time.

CREATE TABLE IF NOT EXISTS analytics.basketball_team_elo (
    team_id       int NOT NULL REFERENCES analytics.teams(id),
    date          date NOT NULL,
    elo_rating    decimal(6,1) NOT NULL DEFAULT 1500.0,
    elo_change_1m decimal(5,1),
    PRIMARY KEY (team_id, date)
);

CREATE INDEX IF NOT EXISTS idx_bb_elo_date ON analytics.basketball_team_elo(date DESC);
