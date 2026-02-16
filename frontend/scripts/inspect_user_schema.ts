import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Table: profiles ---');
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (pError) console.error(pError);
    else console.log(Object.keys(profiles[0] || {}));

    console.log('\n--- Table: user_stats ---');
    const { data: stats, error: sError } = await supabase
        .from('user_stats')
        .select('*')
        .limit(1);

    if (sError) console.error(sError);
    else console.log(Object.keys(stats[0] || {}));

    console.log('\n--- Table: subscriptions ---');
    const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);

    if (subError) console.error(subError);
    else console.log(Object.keys(subs[0] || {}));
}

inspectSchema();
