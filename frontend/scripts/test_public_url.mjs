
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env.local from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function checkPublicUrl() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        console.error("❌ NEXT_PUBLIC_SUPABASE_URL is missing");
        return;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/logos/betix_logo.png`;
    console.log(`\n🔍 Testing Public URL: ${publicUrl}`);

    try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        console.log(`Status Code: ${response.status}`);

        if (response.ok) {
            console.log("✅ Public URL is accessible!");
        } else {
            console.log("❌ Public URL is NOT accessible.");
            console.log("Possible reasons: Bucket is not generic 'public', or file name mismatch.");
        }
    } catch (error) {
        console.error("Error fetching URL:", error.message);
    }
}

checkPublicUrl();
