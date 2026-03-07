/**
 * BETIX — Mollie Webhook Route
 * POST /api/mollie/webhook
 * 
 * Appelée par Mollie à chaque changement de statut de paiement.
 * 
 * Flux :
 * 1. Reçoit l'ID du paiement via le body (id=tr_xxx)
 * 2. Récupère les détails du paiement depuis Mollie
 * 3. Si c'est un premier paiement réussi → crée l'abonnement Mollie
 * 4. Met à jour la table subscriptions dans Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { mollieClient } from '@/lib/mollie';

export async function POST(req: NextRequest) {
    try {
        // 1. Mollie envoie l'ID du paiement en form-urlencoded
        const body = await req.text();
        const params = new URLSearchParams(body);
        const paymentId = params.get('id');

        if (!paymentId) {
            console.error('[Mollie/Webhook] No payment ID received');
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        console.log(`[Mollie/Webhook] Processing payment: ${paymentId}`);

        // 2. Récupérer les détails du paiement
        const payment = await mollieClient.payments.get(paymentId);
        const rawMetadata = payment.metadata;
        const metadata = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : (rawMetadata || {});

        console.log(`[Mollie/Webhook] Payment status: ${payment.status}, sequenceType: ${payment.sequenceType}`);

        // 3. Traitement selon le statut
        if (payment.status === 'paid') {
            await handlePaidPayment(payment, metadata);
        } else if (payment.status === 'failed' || payment.status === 'expired' || payment.status === 'canceled') {
            await handleFailedPayment(payment, metadata);
        }

        // Mollie attend toujours un 200 OK
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error: any) {
        console.error('[Mollie/Webhook] Error:', error);
        // On retourne quand même 200 pour que Mollie ne retry pas indéfiniment
        return NextResponse.json({ received: true }, { status: 200 });
    }
}

/**
 * Gère un paiement réussi.
 * - Premier paiement : crée l'abonnement Mollie + enregistre dans Supabase
 * - Paiement récurrent : met à jour current_period_end
 */
async function handlePaidPayment(payment: any, metadata: any) {
    const userId = metadata.supabase_user_id;
    const planId = metadata.plan_id;
    const interval = metadata.interval;

    if (!userId) {
        console.error('[Mollie/Webhook] No supabase_user_id in metadata');
        return;
    }

    // CAS 1 : Premier paiement → créer l'abonnement récurrent
    if (payment.sequenceType === 'first' && planId && interval) {
        console.log(`[Mollie/Webhook] First payment successful. Creating subscription for user ${userId}...`);

        try {
            // Récupérer le plan pour le prix
            const { data: plan } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (!plan) {
                console.error(`[Mollie/Webhook] Plan ${planId} not found`);
                return;
            }

            // Extraire trial_days depuis metadata
            const trialDays = metadata.trial_days ? parseInt(metadata.trial_days, 10) : 0;
            const isTrial = trialDays > 0;

            const subscriptionParams: any = {
                customerId: payment.customerId,
                amount: {
                    currency: 'EUR',
                    value: Number(plan.price).toFixed(2),
                },
                interval: interval,
                description: isTrial
                    ? `BETIX — ${plan.name} (Prélèvement après ${trialDays}j d'essai)`
                    : `BETIX — ${plan.name}`,
                webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/mollie/webhook`,
                metadata: JSON.stringify({
                    supabase_user_id: userId,
                    plan_id: planId,
                }),
            };

            let nextPeriodEnd = new Date();

            if (isTrial) {
                const startDate = new Date(Date.now() + trialDays * 86400000);
                subscriptionParams.startDate = startDate.toISOString().split('T')[0]; // Format requis YYYY-MM-DD
                nextPeriodEnd = startDate; // Dans Supabase, la période en cours se termine à la fin de l'essai
                console.log(`[Mollie/Webhook] Trial plan detected. First recurring payment scheduled for ${subscriptionParams.startDate}`);
            } else {
                nextPeriodEnd = calculateNextPeriodEnd(interval);
            }

            // Créer l'abonnement Mollie (paiements récurrents automatiques)
            const subscription = await mollieClient.customerSubscriptions.create(subscriptionParams);

            console.log(`[Mollie/Webhook] Subscription created: ${subscription.id}`);

            // Enregistrer/mettre à jour l'abonnement dans Supabase
            await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'active',
                    current_period_end: nextPeriodEnd.toISOString(),
                    source: 'mollie',
                    mollie_subscription_id: subscription.id,
                });

            console.log(`[Mollie/Webhook] Subscription saved in Supabase for user ${userId}`);

        } catch (err: any) {
            console.error('[Mollie/Webhook] Error creating subscription:', err.message);
        }

        // CAS 2 : Paiement récurrent (renouvellement automatique)
    } else if (payment.sequenceType === 'recurring') {
        console.log(`[Mollie/Webhook] Recurring payment received for user ${userId}`);

        // Récupérer l'abonnement existant pour connaître l'intervalle
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existingSub) {
            const planInterval = metadata.interval || '1 month';
            const nextPeriodEnd = calculateNextPeriodEnd(planInterval);

            await supabaseAdmin
                .from('subscriptions')
                .update({
                    status: 'active',
                    current_period_end: nextPeriodEnd.toISOString(),
                })
                .eq('user_id', userId);

            console.log(`[Mollie/Webhook] Subscription renewed until ${nextPeriodEnd.toISOString()}`);
        }
    }
}

/**
 * Gère un paiement échoué/expiré/annulé.
 */
async function handleFailedPayment(payment: any, metadata: any) {
    const userId = metadata.supabase_user_id;
    if (!userId) return;

    console.log(`[Mollie/Webhook] Payment ${payment.status} for user ${userId}`);

    // Mettre à jour le statut de l'abonnement
    const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (existingSub) {
        const newStatus = payment.status === 'canceled' ? 'canceled' : 'past_due';

        await supabaseAdmin
            .from('subscriptions')
            .update({ status: newStatus })
            .eq('user_id', userId);

        console.log(`[Mollie/Webhook] Subscription status updated to "${newStatus}"`);
    }
}

/**
 * Calcule la prochaine date d'échéance en fonction de l'intervalle Mollie.
 */
function calculateNextPeriodEnd(interval: string): Date {
    const now = new Date();
    const [amount, unit] = interval.split(' ');
    const num = parseInt(amount);

    switch (unit) {
        case 'day':
        case 'days':
            now.setDate(now.getDate() + num);
            break;
        case 'week':
        case 'weeks':
            now.setDate(now.getDate() + num * 7);
            break;
        case 'month':
        case 'months':
            now.setMonth(now.getMonth() + num);
            break;
        case 'year':
        case 'years':
            now.setFullYear(now.getFullYear() + num);
            break;
        default:
            now.setMonth(now.getMonth() + 1); // Fallback mensuel
    }

    return now;
}
