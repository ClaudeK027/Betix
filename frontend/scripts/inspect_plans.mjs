
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

async function inspectSchema() {
    console.log("🔍 Inspecting Plans Table...");
    const { data, error } = await supabase.from("plans").select("*");

    if (error) {
        console.error("❌ Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Existing columns:", Object.keys(data[0]));
        console.log("Sample Data:", data[0]);
    } else {
        console.log("Table is empty or not accessible.");
    }
}

inspectSchema();
