
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf-8');
envConfig.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log("🔍 Inspecting Check Constraints...");

    // Using a raw query via rpc if available, or just trying to insert to see error detail
    // But since run_sql is not available, we have to guess or use a known valid value.
    // Let's try to query a valid subscription to see what 'source' it uses.

    const { data: subs, error } = await supabaseAdmin
        .from('subscriptions')
        .select('source')
        .limit(10);

    if (subs) {
        console.log("Existing distinct sources:", [...new Set(subs.map(s => s.source))]);
    } else {
        console.error("Error fetching subs:", error);
    }
}

main().catch(console.error);
