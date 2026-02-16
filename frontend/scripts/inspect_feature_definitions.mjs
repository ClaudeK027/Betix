
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
    console.log("🔍 Inspecting Feature Definitions Schema...");

    const { data, error } = await supabaseAdmin
        .from('feature_definitions')
        .select('*');

    if (error) {
        console.error("Error fetching feature_definitions:", error);
        return;
    }

    console.log("Feature Definitions:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
