"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, History, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plan, FeatureDefinition } from "@/types/plans";
import { getDisplayFeatures } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default function SubscriptionPage() {
    const { subscription, currentPlanId, isLoading: authLoading } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [definitions, setDefinitions] = useState<FeatureDefinition[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Plans
                const { data: plansData, error: plansError } = await supabase
                    .from("plans")
                    .select("*")
                    .eq('is_active', true)
                    .order("position", { ascending: true });

                if (plansError) throw plansError;

                // 2. Fetch Feature Definitions
                const { data: defsData, error: defsError } = await supabase
                    .from('feature_definitions')
                    .select('*');

                if (defsError) throw defsError;

                setPlans(plansData || []);
                setDefinitions(defsData || []);
            } catch (err) {
                console.error("Error fetching subscription data:", err);
            } finally {
                setLoadingPlans(false);
            }
        };

        console.log("SubscriptionPage: Fetching plans...");
        fetchData();
    }, [supabase]);

    if (authLoading || loadingPlans) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="size-8 animate-spin text-blue-500" />
            </div>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <CreditCard className="size-8 text-blue-500" />
                    Gestion de l'Abonnement
                </h1>
                <p className="text-neutral-400 mt-2 text-lg">
                    Gérez votre plan, vos factures et vos méthodes de paiement.
                </p>
            </div>

            {/* Current Status Card */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-xl p-6 md:p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Zap className="size-64 -rotate-12" />
                </div>

                <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest">Plan Actuel</span>
                            {subscription?.status === 'active' ? (
                                <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">Active</Badge>
                            ) : (
                                <Badge variant="outline" className="text-neutral-400">Inactif</Badge>
                            )}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            {subscription?.plan?.name || "The Scout (Gratuit)"}
                        </h2>
                        {subscription?.current_period_end && (
                            <p className="text-neutral-400 flex items-center gap-2">
                                <History className="size-4" />
                                Renouvellement le <span className="text-white font-mono">{formatDate(subscription.current_period_end)}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <Button className="bg-white text-black hover:bg-neutral-200 font-bold h-12 px-8">
                            Gérer sur Stripe
                        </Button>
                        <p className="text-xs text-center text-neutral-500">
                            Via le portail sécurisé Stripe
                        </p>
                    </div>
                </div>
            </Card>

            {/* Plans Grid */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="size-5 text-blue-500" />
                    Changer de Plan
                </h3>

                {plans.length === 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl text-center">
                        <p className="text-amber-500">
                            Aucun plan trouvé. Veuillez vérifier la connexion ou le seed de la base de données.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-8 items-stretch">
                        {plans.map((dbPlan) => {
                            const isCurrent = currentPlanId === dbPlan.id;

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
                                    cta = "Rester Gratuit";
                                    break;
                                case 'daily':
                                    period = "/jour";
                                    variant = "premium";
                                    cta = "Passer Premium";
                                    break;
                                case 'weekly':
                                    period = "/semaine";
                                    variant = "premium";
                                    cta = "Passer Premium";
                                    break;
                                case 'monthly':
                                    period = "/mois";
                                    variant = "premium";
                                    badge = "POPULAIRE";
                                    cta = "Passer Premium";
                                    break;
                                case 'yearly':
                                    period = "/an";
                                    variant = "annual";
                                    badge = "BEST VALUE";
                                    badgeColor = "bg-amber-500 text-black";
                                    cta = "Passer Mogul";
                                    break;
                            }

                            const planProps = {
                                id: dbPlan.id,
                                name: dbPlan.name,
                                price: priceDisplay,
                                period,
                                desc: dbPlan.description || "Accès complet",
                                badge,
                                badgeColor,
                                features: featuresList,
                                cta,
                                ctaLink: `/api/stripe/checkout?priceId=${dbPlan.stripe_price_id || dbPlan.id}`,
                                promo: dbPlan.promo ? {
                                    price: dbPlan.promo.price,
                                    duration: dbPlan.promo.duration,
                                    savings: dbPlan.promo.savings
                                } : undefined
                            };

                            const count = plans.length;
                            const maxWidthClass =
                                count === 1 ? "md:max-w-[38rem] scale-105" :
                                    count === 2 ? "md:max-w-[30rem]" :
                                        count === 3 ? "md:max-w-[24rem]" :
                                            "md:max-w-[20rem]";

                            return (
                                <div key={dbPlan.id} className={cn(
                                    "w-full flex transition-all duration-700 ease-out",
                                    maxWidthClass,
                                    count === 1 ? "py-4" : ""
                                )}>
                                    <PricingCard
                                        plan={planProps}
                                        variant={variant}
                                        isCurrentPlan={isCurrent}
                                        subscriptionStatus={subscription?.status}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
