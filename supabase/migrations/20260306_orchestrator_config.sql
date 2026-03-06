-- ============================================================
-- BETIX -- Configuration dynamique des orchestrateurs
-- Date : 2026-03-06
-- Description : Ajoute les cles de configuration pour les 3
--               orchestrateurs dans system_config, permettant
--               de les piloter depuis le panel admin.
-- ============================================================

-- 1. Orchestrator Live (orchestrator.py)
INSERT INTO public.system_config (key, value, description) VALUES
    ('orch_live.enabled',              'true', 'Active/desactive l''orchestrateur live'),
    ('orch_live.monitor_interval_s',   '120',  'Intervalle du cycle principal en secondes (defaut: 120)'),
    ('orch_live.mark_live_every_n',    '2',    'Lancer mark_live toutes les N iterations (defaut: 2 = 4min)'),
    ('orch_live.mark_imminent_every_n','8',    'Lancer mark_imminent toutes les N iterations (defaut: 8 = 16min)')
ON CONFLICT (key) DO NOTHING;

-- 2. Orchestrator Data (orchestrator_data.py)
INSERT INTO public.system_config (key, value, description) VALUES
    ('orch_data.enabled',           'true', 'Active/desactive l''orchestrateur data'),
    ('orch_data.sleep_interval_s',  '60',   'Intervalle du cycle principal en secondes (defaut: 60)'),
    ('orch_data.discovery_every_n', '360',  'Lancer discovery+odds toutes les N iterations (defaut: 360 = 6h)'),
    ('orch_data.cleanup_every_n',   '480',  'Lancer cleanup/stats toutes les N iterations (defaut: 480 = 8h)'),
    ('orch_data.discovery_days',    '10',   'Fenetre de decouverte des matchs en jours (defaut: 10)')
ON CONFLICT (key) DO NOTHING;

-- 3. Orchestrator AI (orchestrator_ai.py)
INSERT INTO public.system_config (key, value, description) VALUES
    ('orch_ai.enabled',           'true', 'Active/desactive l''orchestrateur IA'),
    ('orch_ai.check_interval_s',  '300',  'Intervalle de verification du planning en secondes (defaut: 300)'),
    ('orch_ai.tolerance_min',     '10',   'Tolerance en minutes autour de l''heure planifiee (defaut: 10)'),
    ('orch_ai.scan_days',         '3',    'Fenetre de scan des matchs eligibles en jours (defaut: 3)'),
    ('orch_ai.audit_pause_s',     '3',    'Pause entre deux audits IA en secondes (defaut: 3)'),
    ('orch_ai.run1_hour',         '8',    'Heure UTC du Run 1 (defaut: 8)'),
    ('orch_ai.run2_hour',         '14',   'Heure UTC du Run 2 (defaut: 14)'),
    ('orch_ai.run3_hour',         '18',   'Heure UTC du Run 3 (defaut: 18)'),
    ('orch_ai.run4_hour',         '22',   'Heure UTC du Run 4 (defaut: 22)')
ON CONFLICT (key) DO NOTHING;

-- 4. Config par sport pour l'orchestrateur AI
INSERT INTO public.system_config (key, value, description) VALUES
    ('orch_ai.football.enabled',      'true',                       'Active/desactive les audits football'),
    ('orch_ai.football.runs_per_day', '2',                          'Nombre de runs IA par jour pour le football'),
    ('orch_ai.football.provider',     'claude',                     'Provider IA pour le football (claude/gemini/gpt)'),
    ('orch_ai.football.model',        'claude-haiku-4-5-20251001',  'Modele IA pour le football'),

    ('orch_ai.basketball.enabled',      'true',                       'Active/desactive les audits basketball'),
    ('orch_ai.basketball.runs_per_day', '3',                          'Nombre de runs IA par jour pour le basketball'),
    ('orch_ai.basketball.provider',     'claude',                     'Provider IA pour le basketball (claude/gemini/gpt)'),
    ('orch_ai.basketball.model',        'claude-haiku-4-5-20251001',  'Modele IA pour le basketball'),

    ('orch_ai.tennis.enabled',      'true',                       'Active/desactive les audits tennis'),
    ('orch_ai.tennis.runs_per_day', '4',                          'Nombre de runs IA par jour pour le tennis'),
    ('orch_ai.tennis.provider',     'claude',                     'Provider IA pour le tennis (claude/gemini/gpt)'),
    ('orch_ai.tennis.model',        'claude-haiku-4-5-20251001',  'Modele IA pour le tennis')
ON CONFLICT (key) DO NOTHING;

-- 5. Autoriser la lecture par les utilisateurs authentifies (admin)
-- La policy SELECT existante autorise deja la lecture (USING true).
-- La policy service_role existante autorise deja l'ecriture.
-- On ajoute une policy pour permettre aux admins d'ecrire via le client Supabase (anon key + JWT).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'system_config' AND policyname = 'Admin can update system_config'
    ) THEN
        CREATE POLICY "Admin can update system_config"
            ON public.system_config
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role IN ('admin', 'super_admin')
                )
            );
    END IF;
END $$;
