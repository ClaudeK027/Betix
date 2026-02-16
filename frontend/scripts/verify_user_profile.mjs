
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging purposes
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verify(email) {
    console.log(`\n🔍 Verifying email: ${email}`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error("❌ Error listing users:", userError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`❌ User not found in auth.users.`);
        return;
    }
    console.log(`✅ User found: ${user.id}`);

    // 2. Check Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error("❌ Profile MISSING or ERROR:", profileError.message);
        console.log("Creating profile now...");

        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                username: user.user_metadata.username || 'TestUser',
                role: 'user',
                onboarding_completed: true
            })
            .select()
            .single();

        if (createError) {
            console.error("❌ Failed to create profile:", createError.message);
        } else {
            console.log("✅ Profile created successfully:", newProfile);
        }
    } else {
        console.log("✅ Profile exists:", profile);
    }
}

const email = process.argv[2] || 'user@betix.io';
verify(email).catch(console.error);
