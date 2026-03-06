-- ============================================================
-- BETIX — Ajout du plan "Aucun Abonnement"
-- Date : 2026-02-27
-- Description : Crée un plan spécifique utilisé pour restreindre 
--               l'accès au dashboard.
-- ============================================================

INSERT INTO public.plans (id, name, price, features) 
VALUES (
    'no_subscription', 
    'Aucun Abonnement Actif', 
    0.00, 
    '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, features = EXCLUDED.features;

-- Note : Ce plan sert de marqueur pour le Paywall.
-- Les utilisateurs ayant ce plan (ou aucun abonnement) seront redirigés vers /pricing.
