/**
 * BETIX — Stripe Server Client
 * Initialise le SDK Stripe pour les routes API server-side.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('[Stripe] Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Mappe la fréquence d'un plan BETIX vers les paramètres d'intervalle Stripe.
 */
export function toStripeInterval(frequency: string): { interval: Stripe.Price.Recurring.Interval; interval_count: number } {
    switch (frequency) {
        case 'daily':       return { interval: 'day',   interval_count: 1 };
        case 'weekly':      return { interval: 'week',  interval_count: 1 };
        case 'monthly':     return { interval: 'month', interval_count: 1 };
        case 'quarterly':   return { interval: 'month', interval_count: 3 };
        case 'semi_annual': return { interval: 'month', interval_count: 6 };
        case 'yearly':      return { interval: 'year',  interval_count: 1 };
        default:            return { interval: 'month', interval_count: 1 };
    }
}

/**
 * Calcule la prochaine date d'échéance à partir de la fréquence du plan.
 */
export function calculateNextPeriodEnd(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
        case 'daily':       now.setDate(now.getDate() + 1); break;
        case 'weekly':      now.setDate(now.getDate() + 7); break;
        case 'monthly':     now.setMonth(now.getMonth() + 1); break;
        case 'quarterly':   now.setMonth(now.getMonth() + 3); break;
        case 'semi_annual': now.setMonth(now.getMonth() + 6); break;
        case 'yearly':      now.setFullYear(now.getFullYear() + 1); break;
        default:            now.setMonth(now.getMonth() + 1);
    }
    return now;
}
