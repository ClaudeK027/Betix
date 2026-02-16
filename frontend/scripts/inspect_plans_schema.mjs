
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
    console.log("🔍 Inspecting Plans Table Schema...");

    const { data, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching plans:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Plan Object Keys & Types:");
        const plan = data[0];
        for (const [key, value] of Object.entries(plan)) {
            console.log(`${key}: ${typeof value} (${Array.isArray(value) ? 'Array' : 'Scalar'})`);
            if (key === 'features') {
                console.log("--> Features Sample:", JSON.stringify(value, null, 2));
            }
        }
    } else {
        console.log("No plans found to inspect.");
    }
}

main().catch(console.error);
