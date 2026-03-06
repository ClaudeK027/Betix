'use server';

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function getPlansAction() {
    try {
        const { data: plans, error } = await supabaseAdmin
            .from('plans')
            .select('id, name, price, frequency')
            .order('price', { ascending: true });

        if (error) throw new Error(error.message);
        return { success: true, data: plans };
    } catch (error: any) {
        console.error("[Admin Action] Error fetching plans:", error);
        return { success: false, error: error.message };
    }
}

export interface CreateAgentData {
    username: string;
    email: string;
    password: string;
    role: string;
    plan_id: string;
}

export async function createAgentAction(data: CreateAgentData) {
    console.log("[Admin Action] Creating new agent", data.email);

    try {
        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                username: data.username
            }
        });

        if (authError) throw new Error(`Auth creation failed: ${authError.message}`);
        const userId = authUser.user.id;

        // 2. Update Profile (Role & Username)
        // Note: Profile is auto-created by trigger usually, but we force update to be sure of role/username
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                username: data.username,
                role: data.role,
                created_at: new Date().toISOString()
            });

        if (profileError) throw new Error(`Profile creation failed: ${profileError.message}`);

        // 3. Create Subscription
        const defaultPeriodEnd = new Date();
        defaultPeriodEnd.setDate(defaultPeriodEnd.getDate() + 30); // +30 days by default

        const { error: subError } = await supabaseAdmin
            .from('subscriptions')
            .insert({
                user_id: userId,
                plan_id: data.plan_id,
                status: 'active',
                current_period_end: defaultPeriodEnd.toISOString(),
                source: 'manual_gift'
            });

        if (subError) throw new Error(`Subscription creation failed: ${subError.message}`);

        // 4. Initialize Stats (Optional, but good for consistency)
        const { error: statsError } = await supabaseAdmin
            .from('user_stats')
            .insert({
                user_id: userId,
                level: 1,
                xp_current: 0,
                xp_next: 100
            });

        // Ignore stats error as it might be handled by triggers too, just log it
        if (statsError) console.warn("Stats init warning:", statsError.message);

        revalidatePath('/admin/users');
        return { success: true, userId };

    } catch (error: any) {
        console.error("[Admin Action] Create Error:", error);
        return { success: false, error: error.message };
    }
}

export interface UpdateAgentData {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    plan_id?: string;
    subscription_status?: string;
}

export async function updateAgentAction(agentId: string, data: UpdateAgentData) {
    console.log(`[Admin Action] Updating agent ${agentId}`, data);

    try {
        // 1. Update Auth (Email & Password)
        if (data.email || data.password) {
            const authUpdates: any = {};
            if (data.email) authUpdates.email = data.email;
            if (data.password) authUpdates.password = data.password;

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                agentId,
                authUpdates
            );

            if (authError) {
                console.error("[Admin Action] Auth update failed:", authError);
                throw new Error(`Auth update failed: ${authError.message}`);
            }
        }

        // 2. Update Public Profile (Username & Role)
        if (data.username || data.role) {
            const profileUpdates: any = {};
            if (data.username) profileUpdates.username = data.username;
            if (data.role) profileUpdates.role = data.role;

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', agentId);

            if (profileError) {
                console.error("[Admin Action] Profile update failed:", profileError);
                throw new Error(`Profile update failed: ${profileError.message}`);
            }
        }

        // 3. Update Subscription (Plan & Status)
        if (data.plan_id || data.subscription_status) {
            // First check if a subscription exists
            const { data: existingSub } = await supabaseAdmin
                .from('subscriptions')
                .select('user_id, plan_id, mollie_subscription_id')
                .eq('user_id', agentId)
                .single();

            const subUpdates: any = {};
            if (data.plan_id) subUpdates.plan_id = data.plan_id;
            if (data.subscription_status) subUpdates.status = data.subscription_status;

            // Si l'admin change le plan ET qu'un abonnement Mollie existe, l'annuler
            if (data.plan_id && existingSub?.mollie_subscription_id && existingSub.plan_id !== data.plan_id) {
                try {
                    const { data: profile } = await supabaseAdmin
                        .from('profiles')
                        .select('mollie_customer_id')
                        .eq('id', agentId)
                        .single();

                    if (profile?.mollie_customer_id) {
                        const { mollieClient } = await import('@/lib/mollie');
                        await mollieClient.customerSubscriptions.cancel(
                            existingSub.mollie_subscription_id,
                            { customerId: profile.mollie_customer_id }
                        );
                        console.log(`[Admin Action] Cancelled Mollie subscription ${existingSub.mollie_subscription_id} for user ${agentId}`);
                    }
                } catch (mollieErr: any) {
                    console.warn(`[Admin Action] Could not cancel Mollie subscription: ${mollieErr.message}`);
                    // Continue — the subscription might already be cancelled
                }
                // Clear the mollie_subscription_id since admin is overriding
                subUpdates.mollie_subscription_id = null;
                subUpdates.source = 'manual_gift';
            }

            if (existingSub) {
                const { error: subError } = await supabaseAdmin
                    .from('subscriptions')
                    .update(subUpdates)
                    .eq('user_id', agentId);

                if (subError) throw new Error(`Subscription update failed: ${subError.message}`);
            } else {
                // Create if not exists (upsert-like behavior tailored for admin override)
                const { error: subError } = await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: agentId,
                        ...subUpdates,
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
                        source: 'manual_gift' // Audit trail
                    });

                if (subError) throw new Error(`Subscription creation failed: ${subError.message}`);
            }
        }

        revalidatePath('/admin/users');
        return { success: true };

    } catch (error: any) {
        console.error("[Admin Action] Error:", error);
        return { success: false, error: error.message };
    }
}
