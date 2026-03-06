import { createClient } from '@supabase/supabase-js';

// Note: This client should ONLY be used in server-side contexts (Server Actions, API Routes)
// NEVER import this in client components.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if ((!supabaseUrl || !supabaseServiceKey) && typeof window === 'undefined') {
    throw new Error('Missing Supabase Service Role Key');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
