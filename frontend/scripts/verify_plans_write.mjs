
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
    console.log("🧪 Verifying Write Access to Plans Table...");

    const planId = 'free';

    // 1. Read current
    const { data: original, error: readError } = await supabaseAdmin.from('plans').select('description').eq('id', planId).single();
    if (readError) {
        console.error("❌ Read Error:", readError.message);
        return;
    }

    const originalDesc = original.description;
    const testDesc = `Test Update ${Date.now()}`;

    // 2. Write
    const { error: writeError } = await supabaseAdmin
        .from('plans')
        .update({ description: testDesc })
        .eq('id', planId);

    if (writeError) {
        console.error("❌ Write Error:", writeError.message);
        return;
    }

    // 3. Verify Write
    const { data: updated } = await supabaseAdmin.from('plans').select('description').eq('id', planId).single();
    if (updated.description === testDesc) {
        console.log("✅ Write Successful. Description updated.");
    } else {
        console.error("❌ Write Verification Failed.");
    }

    // 4. Revert
    await supabaseAdmin.from('plans').update({ description: originalDesc }).eq('id', planId);
    console.log("✅ Reverted changes.");
}

main().catch(console.error);
