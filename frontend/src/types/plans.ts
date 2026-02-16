export type PlanFrequency = 'free' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PlanFeature {
    // Defines a single feature value within a category (e.g. "20/j" or true)
    value: string | number | boolean;
    // Optional override for display text if different from value
    display?: string;
}

export interface PlanFeatures {
    core: Record<string, PlanFeature | string | boolean>;
    advanced: Record<string, PlanFeature | string | boolean>;
    vip: Record<string, PlanFeature | string | boolean>;
}

export interface PlanPromo {
    price: number;
    savings: string;
    duration: string;
}

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    frequency: PlanFrequency;
    features: PlanFeatures;
    promo: PlanPromo | null;
    stripe_price_id: string | null;
    is_active: boolean;
    position: number;
    created_at?: string;
}

export interface FeatureDefinition {
    id: string;
    label: string;
    description: string | null;
    type: 'text' | 'boolean' | 'number';
}
