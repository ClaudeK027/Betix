
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local to avoid module issues
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    // Fallback to .env
    const envPath2 = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath2)) {
        const envConfig = fs.readFileSync(envPath2, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePlans() {
    console.log("🚀 Updating Plan Features...");

    const plans = [
        {
            id: 'free',
            features: [
                { "text": "2 Pronostics / jour", "included": true },
                { "text": "Analyses \"Safe\" uniquement", "included": true },
                { "text": "Accès aux \"Value Bets\"", "included": false },
                { "text": "Alertes Live", "included": false },
                { "text": "Support VIP", "included": false }
            ]
        },
        {
            id: 'premium_monthly',
            features: [
                { "text": "Pronostics Illimités", "included": true },
                { "text": "Analyses \"Safe\", \"Value\" & \"Risky\"", "included": true },
                { "text": "Alertes Live Instantanées", "included": true },
                { "text": "Gestion de Bankroll", "included": true },
                { "text": "Accès Canal Discord Privé", "included": false }
            ]
        },
        {
            id: 'premium_annual',
            features: [
                { "text": "Tout du pack Insider", "included": true },
                { "text": "2 Mois offerts (Économie)", "included": true },
                { "text": "Badge Profil \"OG\" Unique", "included": true },
                { "text": "Accès Canal Discord Privé", "included": true },
                { "text": "Coaching 1-on-1 (1h/mois)", "included": true }
            ]
        }
    ];

    for (const plan of plans) {
        const { error } = await supabase
            .from('plans')
            .update({ features: plan.features })
            .eq('id', plan.id);

        if (error) {
            console.error(`❌ Error updating ${plan.id}:`, error);
        } else {
            console.log(`✅ Updated features for ${plan.id}`);
        }
    }
}

updatePlans();
