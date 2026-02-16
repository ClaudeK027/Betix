
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
    console.log("🔍 Inspecting User Object from RPC...");

    const { data, error } = await supabaseAdmin.rpc('get_admin_users_v1');

    if (error) {
        console.error("RPC Error:", error);
        return;
    }

    if (data && data.length > 0) {
        const user = data[0];
        console.log("User Keys:", Object.keys(user));
        console.log("Sample User:", user);
    } else {
        console.log("No users found.");
    }
}

main().catch(console.error);
