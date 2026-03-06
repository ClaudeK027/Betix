-- ============================================================
-- BETIX — Migration : Automatisation de l'Abonnement par Défaut
-- Date : 2026-02-27
-- Description : Met à jour handle_new_user pour créer une 
--               souscription 'no_subscription' par défaut.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- 1. Création du profil
    INSERT INTO public.profiles (id, username, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
        now()
    );

    -- 2. Création des réglages par défaut
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

    -- 3. Création des statistiques initiales
    INSERT INTO public.user_stats (user_id) VALUES (NEW.id);

    -- 4. Création de l'abonnement par défaut (Restriction par défaut)
    -- Le plan 'no_subscription' doit exister dans la table public.plans
    INSERT INTO public.subscriptions (user_id, plan_id, status, source)
    VALUES (NEW.id, 'no_subscription', 'active', 'mollie');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note : Le trigger on_auth_user_created existe déjà et pointe vers cette fonction.
