/**
 * BETIX — Mollie Verify Route
 * POST /api/mollie/verify
 * 
 * Fallback pour le développement local (quand le webhook ne peut pas être appelé).
 * Vérifie le dernier paiement "first" de l'utilisateur et active l'abonnement si payé.
 * 
 * En production avec webhookUrl configuré, cette route sert de filet de sécurité
 * au cas où le webhook échouerait.
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
                { error: 'Non authentifié.' },
                { status: 401 }
            );
        }

        // 2. Récupérer le planId depuis le body
        const { planId } = await req.json();
        if (!planId) {
            return NextResponse.json(
                { error: 'Plan ID manquant.' },
                { status: 400 }
            );
        }

        // 3. Récupérer le profil avec le mollie_customer_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('mollie_customer_id')
            .eq('id', user.id)
            .single();

        if (!profile?.mollie_customer_id) {
            return NextResponse.json(
                { error: 'Aucun customer Mollie trouvé. Effectuez d\'abord un paiement.' },
                { status: 404 }
            );
        }

        // 4. Lister les paiements récents du customer via l'API Mollie
        const paymentsData = await mollieRequest<{
            _embedded: {
                payments: Array<{
                    id: string;
                    status: string;
                    sequenceType: string;
                    metadata: string;
                }>
            }
        }>('GET', `/customers/${profile.mollie_customer_id}/payments?limit=5`);

        const payments = paymentsData._embedded?.payments || [];

        // 5. Chercher le dernier paiement "first" payé pour ce plan
        const paidPayment = payments.find((p) => {
            const meta = p.metadata ? JSON.parse(p.metadata) : {};
            return p.status === 'paid'
                && p.sequenceType === 'first'
                && meta.plan_id === planId;
        });

        if (!paidPayment) {
            return NextResponse.json({
                verified: false,
                message: 'Aucun paiement confirmé trouvé pour ce plan.'
            });
        }

        // 6. Vérifier si l'abonnement est déjà à jour
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_id, status, mollie_subscription_id')
            .eq('user_id', user.id)
            .single();

        if (existingSub?.plan_id === planId && existingSub?.status === 'active' && existingSub?.mollie_subscription_id) {
            return NextResponse.json({
                verified: true,
                message: 'Abonnement déjà actif pour ce plan.'
            });
        }

        // 7. Récupérer le plan pour les détails
        const { data: plan } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (!plan) {
            return NextResponse.json(
                { error: `Plan "${planId}" introuvable.` },
                { status: 404 }
            );
        }

        // 8. Créer l'abonnement récurrent Mollie
        const intervalMap: Record<string, string> = {
            'daily': '1 day',
            'weekly': '1 week',
            'monthly': '1 month',
            'quarterly': '3 months',
            'semi_annual': '6 months',
            'yearly': '12 months',
        };
        const interval = intervalMap[plan.frequency] || '1 month';

        const publicUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        let mollieSubscriptionId: string | null = null;

        // Si l'utilisateur change de plan, annuler l'ancien abonnement Mollie
        if (existingSub?.mollie_subscription_id && existingSub.plan_id !== planId) {
            try {
                await mollieClient.customerSubscriptions.cancel(
                    existingSub.mollie_subscription_id,
                    { customerId: profile.mollie_customer_id }
                );
                console.log(`[Mollie/Verify] Old subscription ${existingSub.mollie_subscription_id} cancelled (upgrade to ${planId})`);
            } catch (err: any) {
                console.warn(`[Mollie/Verify] Could not cancel old subscription: ${err.message}`);
                // Continuer même si l'annulation échoue (l'ancien abo était peut-être déjà annulé)
            }
        } else if (existingSub?.mollie_subscription_id && existingSub.plan_id === planId) {
            // Même plan, garder l'ancien abonnement
            mollieSubscriptionId = existingSub.mollie_subscription_id;
        }

        // Créer un nouvel abonnement Mollie si nécessaire
        if (!mollieSubscriptionId) {
            try {
                // Si le plan a une période d'essai, décaler le startDate
                const subscriptionParams: any = {
                    customerId: profile.mollie_customer_id,
                    amount: {
                        currency: 'EUR',
                        value: Number(plan.price).toFixed(2),  // Prix normal récurrent
                    },
                    interval: interval,
                    description: plan.trial_days && plan.trial_days > 0
                        ? `BETIX — ${plan.name} (Prélèvement après ${plan.trial_days}j d'essai)`
                        : `BETIX — ${plan.name}`,
                    webhookUrl: `${publicUrl}/api/mollie/webhook`,
                    metadata: JSON.stringify({
                        supabase_user_id: user.id,
                        plan_id: planId,
                    }),
                };

                // startDate retarde le 1er prélèvement récurrent après la période d'essai
                if (plan.trial_days && plan.trial_days > 0) {
                    const startDate = new Date(Date.now() + plan.trial_days * 86400000);
                    subscriptionParams.startDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
                    console.log(`[Mollie/Verify] Trial plan: subscription starts on ${subscriptionParams.startDate} (${plan.trial_days} days from now)`);
                }

                const subscription = await mollieClient.customerSubscriptions.create(subscriptionParams);

                mollieSubscriptionId = subscription.id;
                console.log(`[Mollie/Verify] New subscription created: ${mollieSubscriptionId} (interval: ${interval})`);
            } catch (err: any) {
                console.error('[Mollie/Verify] Error creating subscription:', err.message);
                // Continuer quand même pour mettre à jour la BDD
            }
        }

        // 9. Calculer la prochaine échéance
        // Si période d'essai, la prochaine échéance est trial_days à partir d'aujourd'hui
        // Sinon, c'est l'intervalle normal
        const nextPeriodEnd = new Date();
        if (plan.trial_days && plan.trial_days > 0) {
            nextPeriodEnd.setDate(nextPeriodEnd.getDate() + plan.trial_days);
        } else {
            const [amount, unit] = interval.split(' ');
            const num = parseInt(amount);
            switch (unit) {
                case 'day': case 'days': nextPeriodEnd.setDate(nextPeriodEnd.getDate() + num); break;
                case 'week': case 'weeks': nextPeriodEnd.setDate(nextPeriodEnd.getDate() + num * 7); break;
                case 'month': case 'months': nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + num); break;
                case 'year': case 'years': nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + num); break;
                default: nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
            }
        }

        // 10. Upsert dans Supabase
        await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: user.id,
                plan_id: planId,
                status: 'active',
                current_period_end: nextPeriodEnd.toISOString(),
                source: 'mollie',
                mollie_subscription_id: mollieSubscriptionId || null,
            });

        console.log(`[Mollie/Verify] Subscription activated for user ${user.id}, plan ${planId}`);

        return NextResponse.json({
            verified: true,
            message: 'Abonnement activé avec succès !',
            planId,
            currentPeriodEnd: nextPeriodEnd.toISOString(),
        });

    } catch (error: any) {
        console.error('[Mollie/Verify] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur interne' },
            { status: 500 }
        );
    }
}

// Import natif pour les appels Mollie (réutilisation du même pattern que mollie.ts)
import https from 'https';

const MOLLIE_BASE = 'api.mollie.com';
const API_KEY = process.env.MOLLIE_API_KEY;

function mollieRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
): Promise<T> {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : '';
        const options = {
            hostname: MOLLIE_BASE,
            port: 443,
            path: `/v2${path}`,
            method,
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {}),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`[Mollie ${res.statusCode}] ${parsed.detail || parsed.title || data}`));
                    } else {
                        resolve(parsed as T);
                    }
                } catch {
                    reject(new Error(`[Mollie] Invalid JSON: ${data}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`[Mollie] Network error: ${e.message}`)));
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}
