'use server';

import { supabaseAdmin } from "@/lib/supabase-admin";
import { Plan, PlanFeatures, PlanPromo, FeatureDefinition } from "@/types/plans"; // Use new types
import { revalidatePath } from "next/cache";

export async function getAdminPlansAction(): Promise<{ success: boolean; data?: Plan[]; definitions?: FeatureDefinition[]; error?: string }> {
    try {
        console.log("[Admin Action] Fetching plans...");

        // 1. Fetch Plans
        const { data: plans, error: plansError } = await supabaseAdmin
            .from('plans')
            .select('*')
        if (plansError) throw new Error(`Plans fetch failed: ${plansError.message}`);

        // 2. Fetch Definitions
        const { data: definitions, error: defsError } = await supabaseAdmin
            .from('feature_definitions')
            .select('*');

        if (defsError) throw new Error(`Definitions fetch failed: ${defsError.message}`);

        // 3. Cast to Plan type (Supabase returns loose types, we assume schema matches)
        // We might want to ensure 'features' is correct shape if data was dirty, but migration fixed it.
        const mappedPlans: Plan[] = plans.map(p => ({
            ...p,
            // Ensure promo is effectively PlanPromo or null
            promo: p.promo as PlanPromo | null
        }));

        // Sort Plans: Free -> Daily -> Weekly -> Monthly -> Yearly
        const sortWeights: Record<string, number> = {
            'free': 0, 'gratuit': 0,
            'daily': 1, 'jour': 1,
            'weekly': 2, 'hebdo': 2,
            'monthly': 3, 'mensuel': 3, 'month': 3,
            'yearly': 4, 'annuel': 4, 'year': 4
        };

        mappedPlans.sort((a, b) => {
            const wA = sortWeights[a.frequency?.toLowerCase() || ''] ?? 99;
            const wB = sortWeights[b.frequency?.toLowerCase() || ''] ?? 99;
            return wA - wB;
        });

        return { success: true, data: mappedPlans, definitions: definitions as FeatureDefinition[] };

    } catch (error: any) {
        console.error("[Admin Action] Error:", error);
        return { success: false, error: error.message };
    }
}

export interface UpdatePlanData {
    name?: string;
    description?: string;
    price?: number;
    frequency?: string;
    features?: PlanFeatures; // Full JSONB structure
    promo?: PlanPromo | null;
    is_active?: boolean;
    position?: number;
}

export async function updatePlanAction(planId: string, data: UpdatePlanData) {
    console.log(`[Admin Action] Updating plan ${planId}`, data);
    try {
        // Clean undefined values
        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined) updates.description = data.description;
        if (data.price !== undefined) updates.price = data.price;
        if (data.frequency !== undefined) updates.frequency = data.frequency;
        if (data.features !== undefined) updates.features = data.features;
        if (data.promo !== undefined) updates.promo = data.promo;
        if (data.is_active !== undefined) updates.is_active = data.is_active;
        if (data.position !== undefined) updates.position = data.position;

        const { error } = await supabaseAdmin
            .from('plans')
            .update(updates)
            .eq('id', planId);

        if (error) throw new Error(`Plan update failed: ${error.message}`);

        revalidatePath('/admin/subscriptions');
        revalidatePath('/pricing'); // Revalidate public pages too
        revalidatePath('/dashboard/subscription'); // And dashboard

        return { success: true };
    } catch (error: any) {
        console.error("[Admin Action] Update Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createPlanAction(data: UpdatePlanData) {
    console.log("[Admin Action] Creating new plan", data);
    try {
        // Validation (Basic)
        if (!data.name || data.price === undefined || !data.frequency) {
            return { success: false, error: "Missing mandatory fields: Name, Price, Frequency" };
        }

        // Get max position to append to end
        const { data: maxPosData } = await supabaseAdmin
            .from('plans')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const nextPosition = (maxPosData?.position ?? 0) + 1;

        const { data: newPlan, error } = await supabaseAdmin
            .from('plans')
            .insert({
                name: data.name,
                description: data.description,
                price: data.price,
                frequency: data.frequency,
                features: data.features || { core: {}, advanced: {}, vip: {} }, // Default empty structure
                is_active: false, // Always inactive by default
                position: nextPosition,
                promo: data.promo
            })
            .select()
            .single();

        if (error) throw new Error(`Plan creation failed: ${error.message}`);

        revalidatePath('/pricing');
        revalidatePath('/dashboard/subscription');
        revalidatePath('/admin/subscriptions');

        return { success: true, data: newPlan };
    } catch (error: any) {
        console.error("[Admin Action] Create Error:", error);
        return { success: false, error: error.message };
    }
}
