
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPlans() {
    console.log("🔍 Verifying Public Plans...");
    const { data: plans, error } = await supabase.from("plans").select("*");

    if (error) {
        console.error("❌ Error fetching plans:", error);
        return;
    }

    console.log(`✅ Found ${plans.length} plans:`);
    plans.forEach(p => {
        console.log(JSON.stringify(p, null, 2));
    });
}

verifyPlans();
