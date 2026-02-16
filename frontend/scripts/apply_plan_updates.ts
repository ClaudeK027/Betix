
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

// Read the SQL file passed as argument
const sqlFile = process.argv[2];
if (!sqlFile) {
    console.error("Please provide a SQL file path");
    process.exit(1);
}

const sqlContent = fs.readFileSync(path.resolve(sqlFile), 'utf-8');

// Quick and dirty execution via PostgREST if using raw SQL function, 
// BUT Supabase JS client doesn't support raw SQL directly without a stored procedure 
// or using the pg library.
// HOWEVER, for this environment, let's assume we can use the `rpc` if a function exists, 
// OR simpler: we'll just log that we need to run this manually if we can't.
// Actually, since I have `node-postgres` or similar likely not installed, 
// I will try to use the REST API to update row by row if the logic was complex, 
// but here it is a simple update. 

// To be safe and effective in this restricted env, I will rewrite this script 
// to use the Supabase JS client to update the rows directly instead of raw SQL.

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
