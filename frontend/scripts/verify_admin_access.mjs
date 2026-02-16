
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');

console.log(`Loading .env.local from: ${envPath}`);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const value = values.join('=');
            process.env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
        }
    });
} else {
    console.error("❌ .env.local file not found!");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    console.log("Available keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log("🔍 Verifying Admin Access...");

    // 1. List Users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error("❌ Failed to list users:", listError.message);
        return;
    }

    console.log(`✅ Successfully listed ${users.length} users.`);

    if (users.length === 0) {
        console.log("⚠️ No users found to test update.");
        return;
    }

    const testUser = users[0];
    console.log(`🎯 Testing update on user: ${testUser.id} (${testUser.email})`);

    // 2. Test Update (Update metadata)
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        testUser.id,
        { user_metadata: { last_admin_check: new Date().toISOString() } }
    );

    if (updateError) {
        console.error("❌ Failed to update user metadata:", updateError.message);
    } else {
        console.log("✅ Successfully updated user metadata (Admin Auth working).");
    }

    // 3. Test Profile Update (if profile exists)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', testUser.id)
        .single();

    if (profile) {
        const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ betting_style: 'Analyst' }) // innocuous update
            .eq('id', testUser.id);

        if (updateProfileError) {
            console.error("❌ Failed to update profile:", updateProfileError.message);
        } else {
            console.log("✅ Successfully updated public.profiles (Admin DB Access working).");
        }
    }
}

main().catch(console.error);
