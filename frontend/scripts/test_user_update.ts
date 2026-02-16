
import { supabaseAdmin } from "../src/lib/supabase-admin";
import { updateAgentAction } from "../src/app/(admin)/admin/users/actions";

async function main() {
    console.log("Starting User Update Test...");

    // 1. Get a test user (the most recent one created)
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error || !users.users.length) {
        console.error("Failed to list users:", error);
        return;
    }

    const targetUser = users.users[0];
    console.log(`Target User: ${targetUser.email} (${targetUser.id})`);

    // 2. Update Profile (Role)
    console.log("\n--- Testing Profile Update (Role) ---");
    const result1 = await updateAgentAction(targetUser.id, { role: "user" }); // Set to user first
    console.log("Set to 'user':", result1);

    // 3. Update Auth (Email - using a timestamp alias to avoid conflicts)
    // Be careful not to lose access if it's a real user. 
    // I'll skip email update for safety in this automated test, 
    // but I'll test metadata or password if valid.

    // Let's test Subscription update
    console.log("\n--- Testing Subscription Update ---");
    const result2 = await updateAgentAction(targetUser.id, {
        plan_id: "premium",
        subscription_status: "active"
    });
    console.log("Set to Premium/Active:", result2);

    // 4. Verify changes
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', targetUser.id)
        .single();

    const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', targetUser.id)
        .single();

    console.log("\n--- Verification ---");
    console.log("Profile Role:", profile?.role);
    console.log("Subscription:", sub);

    if (profile?.role === 'user' && sub?.plan_id === 'premium' && sub?.status === 'active') {
        console.log("\n✅ TEST SUCCESS: Updates reflected in DB.");
    } else {
        console.error("\n❌ TEST FAILED: Updates not matched.");
    }
}

main().catch(console.error);
