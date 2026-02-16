
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
    console.log("🧪 Verifying Promo & Frequency Update...");

    const planId = 'free';

    // 1. Read current
    const { data: original } = await supabaseAdmin.from('plans').select('frequency, promo').eq('id', planId).single();
    if (!original) return console.error("❌ Plan not found");

    console.log("Original:", original);

    const testPromo = { price: 0, savings: "TEST 100%", duration: "1 Hour" };
    const testFreq = "mensuel"; // Change free to monthly temporarily

    // 2. Write
    const { error: writeError } = await supabaseAdmin
        .from('plans')
        .update({ promo: testPromo, frequency: testFreq })
        .eq('id', planId);

    if (writeError) return console.error("❌ Write Error:", writeError.message);

    // 3. Verify
    const { data: updated } = await supabaseAdmin.from('plans').select('frequency, promo').eq('id', planId).single();

    const promoMatch = JSON.stringify(updated.promo) === JSON.stringify(testPromo);
    const freqMatch = updated.frequency === testFreq;

    if (promoMatch && freqMatch) {
        console.log("✅ Update Successful:");
        console.log("   Freq:", updated.frequency);
        console.log("   Promo:", updated.promo);
    } else {
        console.error("❌ Mismatch:", updated);
    }

    // 4. Revert
    await supabaseAdmin
        .from('plans')
        .update({ promo: original.promo, frequency: original.frequency })
        .eq('id', planId);

    console.log("✅ Reverted.");
}

main().catch(console.error);
