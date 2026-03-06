-- ============================================================
-- BETIX — Migration : Abonnements Composites
-- Date : 2026-03-01
-- Description : Remplace le JSON 'promo' par des colonnes
--               typées trial_price et trial_days pour
--               supporter les offres de lancement Mollie.
-- ============================================================

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_price numeric DEFAULT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT NULL;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS strikethrough_price numeric DEFAULT NULL;

-- 2. Migrer les données existantes depuis le champ promo
UPDATE public.plans
SET trial_price = (promo->>'price')::numeric,
    trial_days = CASE
        WHEN promo->>'duration' ~ '^\d+[jJdD]?$'
            THEN (regexp_replace(promo->>'duration', '[^0-9]', '', 'g'))::integer
        ELSE NULL
    END
WHERE promo IS NOT NULL
  AND promo->>'price' IS NOT NULL
  AND (promo->>'price')::numeric > 0;

-- 3. On garde la colonne promo pour rollback (sera supprimée après validation)
-- ALTER TABLE public.plans DROP COLUMN IF EXISTS promo;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
