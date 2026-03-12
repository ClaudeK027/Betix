/**
 * BETIX — Stripe Cancel Subscription Route
 * POST /api/stripe/cancel
 *
 * Permet à l'utilisateur d'annuler son abonnement.
 * L'accès premium reste actif jusqu'à la fin de la période payée.
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
                { error: 'Non authentifié.' },
                { status: 401 }
            );
        }

        // 2. Récupérer l'abonnement actuel
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'past_due', 'trialing'])
            .single();

        if (subError || !subscription) {
            return NextResponse.json(
                { error: 'Aucun abonnement actif trouvé.' },
                { status: 404 }
            );
        }

        const stripeSubscriptionId = subscription.stripe_subscription_id;

        if (!stripeSubscriptionId) {
            return NextResponse.json(
                { error: 'Données Stripe manquantes. Contactez le support.' },
                { status: 400 }
            );
        }

        // 3. Annuler l'abonnement sur Stripe
        await stripe.subscriptions.cancel(stripeSubscriptionId);

        console.log(`[Stripe/Cancel] Subscription ${stripeSubscriptionId} canceled for user ${user.id}`);

        // 4. Mettre à jour le statut dans Supabase
        await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('user_id', user.id);

        return NextResponse.json({
            success: true,
            message: 'Abonnement annulé. Votre accès premium reste actif jusqu\'à la fin de la période en cours.'
        });

    } catch (error: any) {
        console.error('[Stripe/Cancel] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur lors de l\'annulation.' },
            { status: 500 }
        );
    }
}
