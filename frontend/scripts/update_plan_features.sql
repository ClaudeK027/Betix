-- Met à jour les features des plans pour montrer une progression claire de la valeur

-- 1. Plan Gratuit : "The Scout"
UPDATE public.plans
SET features = '[
    {"text": "2 Pronostics / jour", "included": true},
    {"text": "Analyses \"Safe\" uniquement", "included": true},
    {"text": "Accès aux \"Value Bets\"", "included": false},
    {"text": "Alertes Live", "included": false},
    {"text": "Support VIP", "included": false}
]'::jsonb
WHERE id = 'free';

-- 2. Plan Mensuel : "The Insider"
UPDATE public.plans
SET features = '[
    {"text": "Pronostics Illimités", "included": true},
    {"text": "Analyses \"Safe\", \"Value\" & \"Risky\"", "included": true},
    {"text": "Alertes Live Instantanées", "included": true},
    {"text": "Gestion de Bankroll", "included": true},
    {"text": "Accès Canal Discord Privé", "included": false}
]'::jsonb
WHERE id = 'premium_monthly';

-- 3. Plan Annuel : "The Mogul"
UPDATE public.plans
SET features = '[
    {"text": "Tout du pack Insider", "included": true},
    {"text": "2 Mois offerts (Économie)", "included": true},
    {"text": "Badge Profil \"OG\" Unique", "included": true},
    {"text": "Accès Canal Discord Privé", "included": true},
    {"text": "Coaching 1-on-1 (1h/mois)", "included": true}
]'::jsonb
WHERE id = 'premium_annual';
