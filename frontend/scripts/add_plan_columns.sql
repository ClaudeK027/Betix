
-- Add new columns for enhanced plan details
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS frequency text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS promo jsonb;

-- Update existing rows with default/initial data
UPDATE public.plans
SET 
    frequency = 'gratuit',
    description = 'Pour découvrir l''interface et quelques pronos safe.'
WHERE id = 'free';

UPDATE public.plans
SET 
    frequency = 'mensuel',
    description = 'L''arsenal complet pour battre les bookmakers.',
    promo = '{"price": 1, "duration": "7 jours", "savings": "-95%"}'::jsonb
WHERE id = 'premium_monthly';

UPDATE public.plans
SET 
    frequency = 'annuel',
    description = 'L''engagement long terme pour les sérieux.',
    promo = '{"price": 179, "duration": "1 an", "savings": "20€ offerts"}'::jsonb
WHERE id = 'premium_annual';
