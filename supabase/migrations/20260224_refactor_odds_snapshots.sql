-- ============================================================
-- Migration : Refactoring de analytics.odds_snapshots
-- Date : 2026-02-24
-- Description : Passage à une structure EAV / JSONB pour 
--               supporter tous les types de marchés (Markets).
-- ============================================================

-- 1. Suppression de l'ancienne table (et de ses index)
-- Note : Nous savons que la table est actuellement vide en production
DROP TABLE IF EXISTS analytics.odds_snapshots;

-- 2. Création de la nouvelle table hyper-flexible
CREATE TABLE analytics.odds_snapshots (
    id              bigserial PRIMARY KEY,
    match_id        int NOT NULL,
    sport           text NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis')),
    bookmaker       text NOT NULL,
    snapshot_at     timestamptz NOT NULL DEFAULT now(),
    
    -- Structure dynamique
    market_name     text NOT NULL,  -- Ex: '1x2', 'Over/Under', 'Both Teams To Score'
    market_value    text,           -- Ex: '2.5' (Pour l'Over/Under), NULL par défaut
    
    -- Format attendu: [{"label": "Home", "odds": 1.50}, {"label": "Draw", "odds": 3.40}]
    odds_data       jsonb NOT NULL
);

-- 3. Création des index optimisés
CREATE INDEX idx_odds_sport_match ON analytics.odds_snapshots(sport, match_id);
CREATE INDEX idx_odds_snapshot_time ON analytics.odds_snapshots(snapshot_at DESC);
CREATE INDEX idx_odds_market ON analytics.odds_snapshots(market_name);
