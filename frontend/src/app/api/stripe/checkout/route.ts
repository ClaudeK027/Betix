/**
 * BETIX — Stripe Checkout Route
 * POST /api/stripe/checkout
 *
 * Flux :
 * 1. Vérifie que l'utilisateur est authentifié
 * 2. Crée ou récupère un Customer Stripe
 * 3. Crée une Checkout Session (mode: subscription) avec trial si applicable
 * 4. Retourne l'URL de redirection vers Stripe Checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
    try {
        // 1. Authentification
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Non authentifié. Veuillez vous connecter.' },
                { status: 401 }
            );
        }

        // 2. Récupérer le plan demandé
        const { planId } = await req.json();
        if (!planId) {
            return NextResponse.json(
                { error: 'Plan ID manquant.' },
                { status: 400 }
            );
        }

        const { data: plan, error: planError } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: `Plan "${planId}" introuvable.` },
                { status: 404 }
            );
        }

        // Plan gratuit (0€) : activer directement sans passer par Stripe
        if (plan.price <= 0 && (!plan.trial_price || plan.trial_price <= 0)) {
            // Annuler un éventuel abonnement Stripe existant
            const { data: existingSub } = await supabaseAdmin
                .from('subscriptions')
                .select('stripe_subscription_id')
                .eq('user_id', user.id)
                .single();

            if (existingSub?.stripe_subscription_id) {
                try {
                    await stripe.subscriptions.cancel(existingSub.stripe_subscription_id);
                } catch (e: any) {
                    console.warn(`[Stripe/Checkout] Could not cancel old subscription: ${e.message}`);
                }
            }

            // Activer le plan gratuit directement en BDD
            await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: user.id,
                    plan_id: planId,
                    status: 'active',
                    current_period_end: null,
                    source: 'stripe',
                    stripe_subscription_id: null,
                });

            console.log(`[Stripe/Checkout] Free plan "${planId}" activated for user ${user.id}`);

            const publicUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            return NextResponse.json({
                free: true,
                redirectUrl: `${publicUrl}/profile/subscription?status=success&planId=${planId}`,
            });
        }

        // 3. Récupérer ou créer le Customer Stripe
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, stripe_customer_id')
            .eq('id', user.id)
            .single();

        let stripeCustomerId = profile?.stripe_customer_id;

        // Si c'est un ancien ID Mollie (cst_...), on l'ignore pour forcer la création d'un client Stripe valide
        if (stripeCustomerId && stripeCustomerId.startsWith('cst_')) {
            console.log(`[Stripe/Checkout] Ignoring old Mollie customer ID: ${stripeCustomerId}`);
            stripeCustomerId = null;
        }

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                name: profile?.username || user.email || 'Utilisateur BETIX',
                email: user.email || '',
                metadata: { supabase_user_id: user.id },
            });

            stripeCustomerId = customer.id;

            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', user.id);
        }

        // 4. Résoudre le Stripe Price ID
        // Si le plan a un stripe_price_id en BDD, on l'utilise directement.
        // Sinon, on crée un prix ad-hoc via l'API Stripe.
        let priceId = plan.stripe_price_id;

        if (!priceId) {
            return NextResponse.json(
                { error: `Le plan "${planId}" n'a pas de stripe_price_id configuré. Configurez-le dans le dashboard Stripe puis mettez à jour la BDD.` },
                { status: 400 }
            );
        }

        // 5. Créer la Checkout Session
        const publicUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const sessionParams: any = {
            customer: stripeCustomerId,
            mode: 'subscription' as const,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${publicUrl}/profile/subscription?status=success&planId=${planId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${publicUrl}/profile/subscription?status=canceled`,
            metadata: {
                supabase_user_id: user.id,
                plan_id: planId,
            },
            subscription_data: {
                metadata: {
                    supabase_user_id: user.id,
                    plan_id: planId,
                },
            },
        };

        // Gestion des trials
        if (plan.trial_days && plan.trial_days > 0) {
            sessionParams.subscription_data.trial_period_days = plan.trial_days;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        console.log(`[Stripe/Checkout] Session created: ${session.id} for user ${user.id}`);

        return NextResponse.json({ checkoutUrl: session.url });

    } catch (error: any) {
        console.error('[Stripe/Checkout] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur interne' },
            { status: 500 }
        );
    }
}
