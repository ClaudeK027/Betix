import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging purposes (since dotenv is flaky in this env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase constants.");
    process.exit(1);
}

// Use Service Role Key to bypass RLS for debugging
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const supabase_admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyUserProfile(email: string) {
    console.log(`Checking profile for email: ${email}`);

    // 1. Get User ID from Auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("Error listing users:", userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User with email ${email} not found in Auth.`);
        return;
    }

    console.log(`User found. ID: ${user.id}`);

    // 2. Check public.profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError);
        console.log("FAILURE: Profile missing or error.");
    } else {
        console.log("Profile found:", profile);
        console.log("SUCCESS: Profile exists.");
    }
}

// Usage: npm run verify-profile <email>
const email = process.argv[2];
if (!email) {
    console.log("Please provide an email address.");
    console.log("Usage: npx tsx scripts/verify_user_profile.ts <email>");
} else {
    verifyUserProfile(email);
}
