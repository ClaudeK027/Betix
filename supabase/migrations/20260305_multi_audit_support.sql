-- ============================================================
-- BETIX — Support multi-audit par match (N analyses/jour)
-- Date : 2026-03-05
-- Description : Remplace la contrainte UNIQUE(match_id, sport) par
--               UNIQUE(match_id, sport, run_id) pour permettre
--               plusieurs snapshots d'analyse IA par jour.
--               Ajoute un run_id (ex: "2026-03-05_run1") pour identifier
--               chaque passage du batch.
-- ============================================================

-- 1. Ajouter la colonne run_id
ALTER TABLE public.ai_match_audits
    ADD COLUMN IF NOT EXISTS run_id TEXT NOT NULL DEFAULT 'legacy';

-- 2. Ajouter la colonne provider/model pour tracer le modele utilise
ALTER TABLE public.ai_match_audits
    ADD COLUMN IF NOT EXISTS ai_provider TEXT,
    ADD COLUMN IF NOT EXISTS ai_model TEXT;

-- 3. Supprimer l'ancienne contrainte UNIQUE
ALTER TABLE public.ai_match_audits
    DROP CONSTRAINT IF EXISTS ai_match_audits_match_id_sport_key;

-- 4. Nouvelle contrainte : un audit par match/sport/run
ALTER TABLE public.ai_match_audits
    ADD CONSTRAINT ai_match_audits_match_sport_run_key UNIQUE(match_id, sport, run_id);

-- 5. Index sur run_id pour les requetes de scheduling
CREATE INDEX IF NOT EXISTS idx_match_audits_run_id ON public.ai_match_audits(run_id);

COMMENT ON COLUMN public.ai_match_audits.run_id IS 'Identifiant du passage batch (ex: 2026-03-05_run1). Permet N analyses par jour.';
