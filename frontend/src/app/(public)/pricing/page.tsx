"use client";

import { useEffect, useState } from "react";
import { PricingCard } from "@/components/pricing/PricingCard";
import { TrustBadge } from "@/components/pricing/TrustBadge";
import { FeatureMatrix } from "@/components/pricing/FeatureMatrix";
import { FAQSection } from "@/components/pricing/FAQSection";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Plan, FeatureDefinition } from "@/types/plans";
import { getDisplayFeatures, getMonthlyEquivalent } from "@/lib/plans";

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [definitions, setDefinitions] = useState<FeatureDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Plans
                const { data: plansData, error: plansError } = await supabase
                    .from('plans')
                    .select('*')
                    .eq('is_active', true) // Only active plans
                    .order('position', { ascending: true });

                if (plansError) throw plansError;

                // 2. Fetch Feature Definitions
                const { data: defsData, error: defsError } = await supabase
                    .from('feature_definitions')
                    .select('*');

                if (defsError) throw defsError;

                setPlans(plansData || []);
                setDefinitions(defsData || []);
            } catch (err) {
                console.error("Error fetching pricing data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="size-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    // Identifiers for logic (fallback to frequency if IDs change)
    const monthlyPlan = plans.find(p => p.frequency === 'monthly');
    const annualPlan = plans.find(p => p.frequency === 'yearly');

    // Filter out annual plan from main grid if we want to toggle it manually
    // Or just map all plans? Current design has a toggle that affects the "Annual" card display.
    // Let's stick to the mapped display logic.

    const displayPlans = plans.map(dbPlan => {
        // Prepare features flattened list
        const featuresList = getDisplayFeatures(dbPlan, definitions);

        // Visual Logic & Period Mapping
        let period = "/mois";
        let variant: "free" | "premium" | "annual" = "premium";
        let badge: string | undefined = undefined;
        let badgeColor: string | undefined = undefined;
        let priceDisplay = dbPlan.price.toString();
        let cta = "Choisir";

        switch (dbPlan.frequency) {
            case 'free':
                period = "/forever";
                variant = "free";
                cta = "Débuter";
                break;
            case 'daily':
                period = "/jour";
                variant = "premium";
                cta = "Débuter maintenant";
                break;
            case 'weekly':
                period = "/semaine";
                variant = "premium";
                cta = "Débuter maintenant";
                break;
            case 'monthly':
                period = "/mois";
                variant = "premium";
                badge = "POPULAIRE";
                cta = "Débuter maintenant";
                break;
            case 'yearly':
                period = "/an";
                variant = "annual";
                badge = "BEST VALUE";
                badgeColor = "bg-amber-500 text-black";
                cta = "Débuter maintenant";

                // If toggle is ON, show monthly equivalent
                if (isAnnual) {
                    priceDisplay = getMonthlyEquivalent(dbPlan.price, 'yearly');
                    period = "/mois"; // Visual trick
                }
                break;
        }

        return {
            id: dbPlan.id,
            name: dbPlan.name,
            price: priceDisplay,
            period,
            desc: dbPlan.description || "Accès complet",
            badge,
            badgeColor,
            features: featuresList,
            cta,
            ctaLink: `/signup?plan=${dbPlan.id}`,
            promo: dbPlan.promo ? {
                price: dbPlan.promo.price,
                duration: dbPlan.promo.duration,
                savings: dbPlan.promo.savings
            } : undefined
        };
    });

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="relative container mx-auto px-4 py-24 space-y-24">

                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 px-4 py-1 uppercase tracking-widest text-xs font-bold animate-fade-in">
                        <Zap className="size-3 mr-2 fill-blue-500" /> Unlock Your Edge
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white animate-fade-in-up">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Weapon</span>
                    </h1>

                    <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-100">
                        Accédez aux données que les bookmakers préféreraient garder secrètes.
                        Rejoignez l'élite des parieurs dès aujourd'hui.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-200">
                        <Label className={cn("text-sm font-bold cursor-pointer transition-colors", !isAnnual ? "text-white" : "text-neutral-500")}>
                            MENSUEL
                        </Label>
                        <Switch
                            checked={isAnnual}
                            onCheckedChange={setIsAnnual}
                            className="data-[state=checked]:bg-amber-500"
                        />
                        <Label className={cn("text-sm font-bold cursor-pointer transition-colors flex items-center gap-2", isAnnual ? "text-white" : "text-neutral-500")}>
                            ANNUEL <Badge className="bg-amber-500 text-black text-[9px] px-1.5 h-4 hover:bg-amber-400">-20%</Badge>
                        </Label>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="flex flex-wrap justify-center gap-10 items-stretch">
                    {displayPlans.map((plan) => {
                        const count = displayPlans.length;

                        // Drastic size mapping for high visibility
                        const maxWidthClass =
                            count === 1 ? "md:max-w-[42rem] scale-110" :
                                count === 2 ? "md:max-w-[34rem] scale-105" :
                                    count === 3 ? "md:max-w-[26rem]" :
                                        "md:max-w-[22rem]";

                        return (
                            <div key={plan.id} className={cn(
                                "w-full flex justify-center transition-all duration-700 ease-out",
                                maxWidthClass,
                                count <= 2 ? "my-8" : "" // Add vertical spacing if scaled up
                            )}>
                                <PricingCard
                                    plan={plan}
                                    variant={plan.id.includes('free') ? 'free' : plan.id.includes('annual') ? 'annual' : 'premium'}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Trust Badge */}
                <div className="py-12">
                    <TrustBadge />
                </div>

                {/* Comparison Matrix */}
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">The Data Advantage</h2>
                        <p className="text-neutral-500">Comparatif détaillé des fonctionnalités</p>
                    </div>
                    {/* Matrix would require similar refactor to be dynamic, keeping static for now to focus on cards */}
                    <FeatureMatrix plans={plans} definitions={definitions} />
                </div>

                {/* FAQ */}
                <div className="pb-24">
                    <FAQSection />
                </div>

            </div>
        </div>
    );
}
