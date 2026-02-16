
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
    console.log("🔍 Checking access to 'logos' bucket...");

    const { data, error } = await supabaseAdmin
        .storage
        .from('logos')
        .list();

    if (error) {
        console.error("❌ Storage Error:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("✅ Files found in 'logos' bucket:");
        data.forEach(file => {
            console.log(`- ${file.name} (${file.metadata?.size || 'unknown size'})`);

            // Generate signed URL to verify accessibility
            supabaseAdmin.storage.from('logos').createSignedUrl(file.name, 60).then(({ data: urlData }) => {
                if (urlData) {
                    console.log(`  [Signed URL Generated for ${file.name}]`);
                }
            });
        });
    } else {
        console.log("⚠️ Bucket 'logos' is empty or not found.");
    }
}

main().catch(console.error);
