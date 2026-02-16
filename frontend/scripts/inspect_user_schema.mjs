import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
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

    // Also check auth.users columns if possible (via a small user fetch)
    // Note: auth.users is usually not directly accessible via public schema client 
    // unless there's a view or we use service role to query auth schema (if allowed)
}

inspectSchema();
