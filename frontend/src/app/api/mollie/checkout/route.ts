/**
 * BETIX — Mollie Checkout Route
 * POST /api/mollie/checkout
 * 
 * Flux :
 * 1. Vérifie que l'utilisateur est authentifié
 * 2. Crée ou récupère un Customer Mollie
 * 3. Crée un "premier paiement" (sequenceType: 'first') pour obtenir un mandat
 * 4. Retourne l'URL de redirection vers Mollie
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mollieClient } from '@/lib/mollie';

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

        // Fetch plan details from Supabase
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

        if (plan.price <= 0 && (!plan.trial_days || plan.trial_days <= 0)) {
            return NextResponse.json(
                { error: 'Le plan gratuit sans essai ne nécessite pas de paiement par carte.' },
                { status: 400 }
            );
        }

        // 3. Récupérer ou créer le profil avec le mollie_customer_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, username, mollie_customer_id')
            .eq('id', user.id)
            .single();

        let mollieCustomerId = profile?.mollie_customer_id;

        if (!mollieCustomerId) {
            // Créer un Customer Mollie
            const customer = await mollieClient.customers.create({
                name: profile?.username || user.email || 'Utilisateur BETIX',
                email: user.email || '',
                metadata: JSON.stringify({ supabase_user_id: user.id }),
            });

            mollieCustomerId = customer.id;

            // Sauvegarder le mollie_customer_id dans le profil
            await supabaseAdmin
                .from('profiles')
                .update({ mollie_customer_id: mollieCustomerId })
                .eq('id', user.id);
        }

        // 4. Mapper la fréquence du plan à un intervalle Mollie
        const intervalMap: Record<string, string> = {
            'daily': '1 day',
            'weekly': '1 week',
            'monthly': '1 month',
            'quarterly': '3 months',
            'semi_annual': '6 months',
            'yearly': '12 months',
        };
        const interval = intervalMap[plan.frequency] || '1 month';

        // 5. Créer le premier paiement (pour obtenir le mandat)
        // Si le plan a un trial_price, on facture ce montant au lieu du prix normal
        const firstPaymentAmount = plan.trial_price != null ? plan.trial_price : plan.price;
        const isTrialPayment = plan.trial_price != null && plan.trial_days != null;

        // redirectUrl → localhost (l'utilisateur est redirigé dans son navigateur)
        // webhookUrl  → URL publique ngrok (Mollie appelle depuis ses serveurs)
        const localUrl = 'http://localhost:3000';
        const publicUrl = process.env.NEXT_PUBLIC_APP_URL || localUrl;
        const hasPublicUrl = publicUrl !== localUrl;

        const paymentParams: any = {
            amount: {
                currency: 'EUR',
                value: Number(firstPaymentAmount).toFixed(2),  // Mollie exige le format "XX.XX"
            },
            customerId: mollieCustomerId,
            sequenceType: 'first' as any,  // Premier paiement pour créer le mandat
            description: isTrialPayment
                ? `BETIX — ${plan.name} (Offre de lancement ${plan.trial_days}j)`
                : `BETIX — ${plan.name} (Premier paiement)`,
            redirectUrl: `${publicUrl}/profile/subscription?status=success&planId=${planId}`,
            metadata: JSON.stringify({
                supabase_user_id: user.id,
                plan_id: planId,
                plan_frequency: plan.frequency,
                interval: interval,
                is_trial: isTrialPayment,
                trial_days: plan.trial_days,
            }),
        };

        // Mollie n'autorise pas localhost pour les webhooks.
        // On utilise l'URL publique (ngrok) uniquement pour le webhook.
        if (hasPublicUrl) {
            paymentParams.webhookUrl = `${publicUrl}/api/mollie/webhook`;
        }

        const payment = await mollieClient.payments.create(paymentParams);

        // 6. Retourner l'URL de paiement
        const paymentResult = payment as any;
        const checkoutUrl = paymentResult._links?.checkout?.href || paymentResult.getCheckoutUrl?.() || null;
        if (!checkoutUrl) {
            return NextResponse.json(
                { error: 'Impossible de créer la session de paiement.' },
                { status: 500 }
            );
        }

        console.log(`[Mollie/Checkout] Payment created: ${paymentResult.id} for user ${user.id}`);

        return NextResponse.json({ checkoutUrl });

    } catch (error: any) {
        console.error('[Mollie/Checkout] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur interne' },
            { status: 500 }
        );
    }
}
