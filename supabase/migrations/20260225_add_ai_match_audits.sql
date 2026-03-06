-- ============================================================
-- BETIX — Ajout de la table d'audit des analyses IA
-- Date : 2026-02-25
-- Description : Stocke le contexte complet et le résultat de l'IA
--               pour chaque match analysé.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_match_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id INT NOT NULL, -- ID interne de la table analytics.*_matches
    sport TEXT NOT NULL CHECK (sport IN ('football', 'basketball', 'tennis')),
    snapshot_at TIMESTAMPTZ, -- Date de la snapshot Bet365 utilisée
    odds JSONB,             -- Cotes utilisées lors de l'analyse
    h2h JSONB,              -- Données Face-à-Face
    rolling_stats JSONB,    -- Statistiques de forme (Rolling)
    ai_analysis JSONB,      -- Le JSON brut retourné par l'IA
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un seul audit par match pour le moment (UPSERT possible)
    UNIQUE(match_id, sport)
);

-- Index pour recherche rapide
CREATE INDEX idx_match_audits_match_id ON public.ai_match_audits(match_id);
CREATE INDEX idx_match_audits_sport ON public.ai_match_audits(sport);
CREATE INDEX idx_match_audits_created ON public.ai_match_audits(created_at DESC);

-- Commentaire de table
COMMENT ON TABLE public.ai_match_audits IS 'Table d''archive stockant le contexte complet et le résultat des analyses produites par le moteur IA.';
