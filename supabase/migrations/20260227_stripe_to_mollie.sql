-- ============================================================
-- BETIX — Migration : Stripe → Mollie
-- Date : 2026-02-27
-- Description : Remplace toutes les références Stripe par Mollie
--               dans les tables plans, subscriptions et profiles.
-- ============================================================

-- 1. PLANS : Renommer stripe_price_id → mollie_plan_id
ALTER TABLE public.plans RENAME COLUMN stripe_price_id TO mollie_plan_id;

-- 2. SUBSCRIPTIONS : Renommer stripe_subscription_id → mollie_subscription_id
ALTER TABLE public.subscriptions RENAME COLUMN stripe_subscription_id TO mollie_subscription_id;

-- 3. SUBSCRIPTIONS : Modifier la contrainte source (stripe → mollie)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;
ALTER TABLE public.subscriptions ALTER COLUMN source SET DEFAULT 'mollie';
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_source_check
    CHECK (source IN ('mollie', 'manual_gift'));

-- 4. SUBSCRIPTIONS : Ajouter le status 'trialing' (pour les essais gratuits éventuels)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'suspended'));

-- 5. PROFILES : Ajouter la colonne pour le customer Mollie
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mollie_customer_id text;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
