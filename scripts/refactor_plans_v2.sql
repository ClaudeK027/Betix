-- ==============================================================================
-- MIGRATION SCRIPT: UPDATE EXISTING PLANS TABLE (SAFE MODE)
-- ==============================================================================

BEGIN;

-- 1. Create 'feature_definitions' (The Dictionary) if not exists
CREATE TABLE IF NOT EXISTS public.feature_definitions (
    id text NOT NULL PRIMARY KEY,
    label text NOT NULL,
    description text,
    type text DEFAULT 'text' CHECK (type IN ('text', 'boolean', 'number')),
    created_at timestamptz DEFAULT now()
);

-- 2. Update 'plans' table structure (Add missing columns only)

-- frequency
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='frequency') THEN
        ALTER TABLE public.plans ADD COLUMN frequency text;
        ALTER TABLE public.plans ADD CONSTRAINT plans_frequency_check CHECK (frequency IN ('free', 'daily', 'weekly', 'monthly', 'yearly'));
    END IF;
END $$;

-- description
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='description') THEN
        ALTER TABLE public.plans ADD COLUMN description text;
    END IF;
END $$;

-- is_active
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='is_active') THEN
        ALTER TABLE public.plans ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;

-- position
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='position') THEN
        ALTER TABLE public.plans ADD COLUMN position integer DEFAULT 0;
    END IF;
END $$;

-- promo
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='promo') THEN
        ALTER TABLE public.plans ADD COLUMN promo jsonb;
    END IF;
END $$;

-- Ensure 'features' is JSONB and has correct default
ALTER TABLE public.plans ALTER COLUMN features SET DEFAULT '{"core": {}, "advanced": {}, "vip": {}}'::jsonb;

-- 3. Seed/Update Feature Definitions
INSERT INTO public.feature_definitions (id, label, description, type) VALUES
('daily_predictions', 'Pronostics Quotidiens', 'Nombre de pronostics par jour', 'text'),
('sports_coverage', 'Sports Couverts', 'Liste des sports inclus', 'text'),
('analysis_depth', 'Profondeur d''Analyse', 'Niveau de détail des analyses écrite', 'text'),
('bankroll_management', 'Gestion de Bankroll', 'Conseils de mise et suivi', 'boolean'),
('vip_support', 'Support VIP 24/7', 'Accès prioritaire au support', 'boolean'),
('algo_access', 'Accès Algorithme', 'Accès aux données brutes de l''IA', 'boolean')
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label,
    description = EXCLUDED.description;

-- 4. Seed/Update Plans (UPSERT)

-- A. FREE PLAN
INSERT INTO public.plans (id, name, description, price, frequency, position, features)
VALUES (
    'free', 
    'The Scout', 
    'Pour découvrir l''interface et quelques pronos safe.', 
    0.00, 
    'free', 
    1,
    '{"core": {"daily_predictions": "2/j", "sports_coverage": "Football Only"}, "advanced": {}, "vip": {}}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- B. MONTHLY PLAN
INSERT INTO public.plans (id, name, description, price, frequency, position, features)
VALUES (
    'premium_monthly', 
    'The Insider', 
    'L''arsenal complet pour battre les bookmakers.', 
    29.99, 
    'monthly', 
    2,
    '{
        "core": {"daily_predictions": "10+/j", "sports_coverage": "Tous Sports"},
        "advanced": {"analysis_depth": "Détaillée", "bankroll_management": true},
        "vip": {}
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- C. ANNUAL PLAN
INSERT INTO public.plans (id, name, description, price, frequency, position, features, promo)
VALUES (
    'premium_annual', 
    'The Mogul', 
    'L''engagement long terme pour les sérieux.', 
    299.99, 
    'yearly', 
    3,
    '{
        "core": {"daily_predictions": "Illimité", "sports_coverage": "Tous Sports + E-Sport"},
        "advanced": {"analysis_depth": "Expert + Data", "bankroll_management": true},
        "vip": {"vip_support": true, "algo_access": true}
    }'::jsonb,
    '{"price": 249.99, "savings": "-50€", "duration": "Offre Lancement"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS (Security)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_definitions ENABLE ROW LEVEL SECURITY;

-- Policies (using IF NOT EXISTS logic via DO block is safer for recreation)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Config Read') THEN
        CREATE POLICY "Public Config Read" ON public.plans FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Features Read') THEN
        CREATE POLICY "Public Features Read" ON public.feature_definitions FOR SELECT USING (true);
    END IF;
END $$;

COMMIT;
