
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error("Error listing buckets:", error);
    } else {
        console.log("Buckets:", data);

        // Also try to list files in 'Users' bucket if it exists
        const usersBucket = data.find(b => b.name === 'users' || b.name === 'Users');
        if (usersBucket) {
            console.log(`\nListing contents of '${usersBucket.name}' bucket:`);
            const { data: files, error: filesError } = await supabase.storage.from(usersBucket.name).list('Avatars');
            if (filesError) console.error("Error listing files:", filesError);
            else console.log("Files in Avatars:", files);
        }
    }
}

listBuckets();
