-- Create system_config table for dynamic settings
CREATE TABLE IF NOT EXISTS public.system_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

-- Seed initial values (UPSERT using INSERT ... ON CONFLICT)
INSERT INTO public.system_config (key, value, description) 
VALUES
    ('schedule_live_interval', '300', 'Interval in seconds for live score updates (default 5m)'),
    ('imminent_check_interval', '600', 'Interval in seconds for checking imminent matches (default 10m)')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS (Optional, but good practice)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (or authenticated)
CREATE POLICY "Allow read access for all" ON public.system_config FOR SELECT USING (true);

-- Allow update access only to service_role or admins (simplified for now)
-- ideally we restrict this, but for MVP we might rely on Supabase Service Key usage in backend.
CREATE POLICY "Allow all access for service role" ON public.system_config USING (auth.role() = 'service_role');
