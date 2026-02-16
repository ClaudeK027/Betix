
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
    console.log("🔍 Inspecting Plans Table (Promo & Frequency)...");

    const { data, error } = await supabaseAdmin
        .from('plans')
        .select('id, name, frequency, promo');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.table(data);

    console.log("\nPromo Details:");
    data.forEach(p => {
        if (p.promo) {
            console.log(`Plan [${p.id}]:`, JSON.stringify(p.promo, null, 2));
        } else {
            console.log(`Plan [${p.id}]: No Promo`);
        }
    });
}

main().catch(console.error);
