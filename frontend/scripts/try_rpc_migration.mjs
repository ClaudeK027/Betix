
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryRpc() {
    console.log("🚀 Attempting to run SQL via RPC...");
    const sql = fs.readFileSync('scripts/add_plan_columns.sql', 'utf8');

    // Try common names for SQL execution function
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.log("❌ exec_sql failed:", error.message);
        // Try another one
        const { data: data2, error: error2 } = await supabase.rpc('run_sql', { sql: sql });
        if (error2) {
            console.log("❌ run_sql failed:", error2.message);
            console.log("⚠️ Could not execute SQL via RPC. Please run 'scripts/add_plan_columns.sql' manually.");
        } else {
            console.log("✅ Success with run_sql!");
        }
    } else {
        console.log("✅ Success with exec_sql!");
    }
}

tryRpc();
