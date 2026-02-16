
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

async function applySql() {
    const sqlPath = path.resolve(__dirname, 'make_logos_public.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS doesn't have a direct raw SQL execution method exposed easily without extensions
    // But we can use the 'pg' library if we had connection string, or rely on a specific RPC if available.
    // HOWEVER, standard storage bucket updates can be done via the Storage API too, but Policies need SQL.
    // Let's try to update the bucket via the Storage API first as it's cleaner.

    console.log("Attempting to update bucket to public via Storage API...");
    const { data, error } = await supabase.storage.updateBucket('logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
        fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
        console.error("Storage API Update Error:", error);
    } else {
        console.log("✅ Bucket 'logos' set to public via API.");
    }
}

applySql();
