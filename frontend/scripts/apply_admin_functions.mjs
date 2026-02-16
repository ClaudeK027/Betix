import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
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

async function applyAdminFunctions() {
    console.log("🚀 Applying Admin Functions SQL...");
    const sql = fs.readFileSync('scripts/admin_functions.sql', 'utf8');

    // Try common names for SQL execution function
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.log("❌ exec_sql failed:", error.message);
        // Try another one
        const { error: error2 } = await supabase.rpc('run_sql', { sql: sql });
        if (error2) {
            console.error("❌ run_sql failed:", error2.message);
            console.log("⚠️ Could not execute SQL via RPC. Please apply 'scripts/admin_functions.sql' manually in Supabase SQL Editor.");
            process.exit(1);
        }
    }

    console.log("✅ get_admin_users_v1 RPC created successfully!");
}

applyAdminFunctions();
