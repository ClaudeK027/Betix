
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
    console.log("🔍 Verifying Subscription Counts...");

    // 1. Fetch Plans
    const { data: plans, error: plansError } = await supabaseAdmin
        .from('plans')
        .select('id, name');

    if (plansError) {
        console.error("Error fetching plans:", plansError);
        return;
    }

    console.log(`Found ${plans.length} plans.`);

    // 2. Fetch Active Subscriptions
    const { data: subs, error: subsError } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id')
        .eq('status', 'active');

    if (subsError) {
        console.error("Error fetching subscriptions:", subsError);
        return;
    }

    console.log(`Found ${subs.length} active subscriptions.`);

    // 3. Aggregate
    const counts = {};
    subs.forEach(sub => {
        counts[sub.plan_id] = (counts[sub.plan_id] || 0) + 1;
    });

    // 4. Report
    console.table(plans.map(p => ({
        id: p.id,
        name: p.name,
        count: counts[p.id] || 0
    })));
}

main().catch(console.error);
