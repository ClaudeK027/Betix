-- ============================================================
-- BETIX — Migration : Mollie → Stripe
-- Date : 2026-03-12
-- Description : Remplace toutes les références Mollie par Stripe
--               dans les tables plans, subscriptions et profiles.
--               Inverse la migration 20260227_stripe_to_mollie.sql.
-- ============================================================

-- 1. PLANS : Renommer mollie_plan_id → stripe_price_id
ALTER TABLE public.plans RENAME COLUMN mollie_plan_id TO stripe_price_id;

-- 2. SUBSCRIPTIONS : Renommer mollie_subscription_id → stripe_subscription_id
ALTER TABLE public.subscriptions RENAME COLUMN mollie_subscription_id TO stripe_subscription_id;

-- 3. Mettre à jour les abonnements existants source = 'mollie' → 'stripe' AVANT d'ajouter la contrainte
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;
UPDATE public.subscriptions SET source = 'stripe' WHERE source = 'mollie';

-- 4. SUBSCRIPTIONS : Appliquer le nouveau default + contrainte source
ALTER TABLE public.subscriptions ALTER COLUMN source SET DEFAULT 'stripe';
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_source_check
    CHECK (source IN ('stripe', 'manual_gift'));

-- 5. PROFILES : Renommer mollie_customer_id → stripe_customer_id
ALTER TABLE public.profiles RENAME COLUMN mollie_customer_id TO stripe_customer_id;

-- 6. Mettre à jour le trigger handle_new_user pour utiliser 'stripe' comme source par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
        now()
    );
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
    INSERT INTO public.subscriptions (user_id, plan_id, status, source)
    VALUES (NEW.id, 'no_subscription', 'active', 'stripe');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
