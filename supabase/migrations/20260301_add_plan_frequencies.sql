-- ============================================================
-- BETIX — Migration : Ajout des fréquences d'abonnement
-- Date : 2026-03-01
-- Description : Ajoute les fréquences quarterly et semi_annual
--               à la table plans.
-- ============================================================

-- 1. Supprimer l'ancienne contrainte de fréquence si elle existe
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_frequency_check;

-- 2. Ajouter la nouvelle contrainte avec toutes les fréquences
ALTER TABLE public.plans ADD CONSTRAINT plans_frequency_check
    CHECK (frequency IN ('free', 'daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'yearly'));

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
