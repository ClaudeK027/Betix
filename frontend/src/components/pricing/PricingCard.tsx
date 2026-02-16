"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Ticket, Crown, Trophy, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingProps {
    plan: {
        id: string;
        name: string;
        price: string;
        period: string;
        desc: string;
        badge?: string;
        badgeColor?: string;
        features: PricingFeature[];
        cta: string;
        ctaLink: string;
        promo?: {
            price?: number;
            duration?: string;
            savings?: string;
        };
    };
    variant: "free" | "premium" | "annual";
    isCurrentPlan?: boolean;
    subscriptionStatus?: string;
}

export function PricingCard({ plan, variant, isCurrentPlan, subscriptionStatus }: PricingProps) {
    const isPremium = variant === "premium";
    const isAnnual = variant === "annual";

    let buttonText = plan.cta;
    let buttonDisabled = false;
    let buttonVariantClass = "";

    if (isCurrentPlan) {
        buttonText = "Plan Actuel";
        buttonDisabled = true;
        buttonVariantClass = "bg-green-500/20 text-green-400 border-green-500/50 cursor-default hover:bg-green-500/20";
    } else {
        buttonVariantClass = variant === "free" ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" :
            isPremium ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.7)]" :
                "bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.7)]";
    }

    return (
        <div className={cn(
            "relative group h-full transition-all duration-500 hover:-translate-y-2",
            isPremium ? "z-10" : "z-0",
            isCurrentPlan && "ring-2 ring-green-500/50"
        )}>
            {/* Holographic Glow Effect (Premium Only) */}
            {isPremium && !isCurrentPlan && (
                <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-purple-600 opacity-75 blur-2xl group-hover:opacity-100 transition-opacity duration-500 animate-pulse-slow" />
            )}

            {/* Annual Gold Glow */}
            {isAnnual && !isCurrentPlan && (
                <div className="absolute -inset-0.5 bg-gradient-to-b from-amber-300 to-amber-600 opacity-30 blur-2xl group-hover:opacity-60 transition-opacity duration-500" />
            )}

            {/* Current Plan Glow */}
            {isCurrentPlan && (
                <div className="absolute -inset-0.5 bg-green-500/30 blur-2xl opacity-50" />
            )}

            <div className={cn(
                "relative h-full flex flex-col p-8 rounded-3xl overflow-hidden backdrop-blur-3xl border transition-all duration-500",
                isCurrentPlan ? "bg-green-950/30 border-green-500/30" :
                    variant === "free" ? "bg-black/40 border-white/10" :
                        isPremium ? "bg-black/80 border-blue-500/50 shadow-[inset_0_0_40px_-10px_rgba(59,130,246,0.3)]" :
                            "bg-black/60 border-amber-500/30 shadow-[inset_0_0_40px_-10px_rgba(245,158,11,0.2)]"
            )}>

                {/* Badges Container */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                    {/* Badge */}
                    {plan.badge && (
                        <Badge className={cn(
                            "text-[10px] uppercase font-bold tracking-widest border-0",
                            plan.badgeColor || "bg-white/10 text-white"
                        )}>
                            {plan.badge}
                        </Badge>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                        <Badge className="text-[10px] uppercase font-bold tracking-widest border-0 bg-green-500 text-black">
                            Actif
                        </Badge>
                    )}
                </div>

                {/* Header */}
                <div className="mb-8">
                    <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center mb-4 border",
                        isCurrentPlan ? "bg-green-500/20 border-green-500/50 text-green-400" :
                            variant === "free" ? "bg-white/5 border-white/10 text-neutral-400" :
                                isPremium ? "bg-blue-500/20 border-blue-500/50 text-blue-400" :
                                    "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    )}>
                        {variant === "free" && <Ticket className="size-6" />}
                        {isPremium && <Crown className="size-6" />}
                        {isAnnual && <Trophy className="size-6" />}
                    </div>

                    <h3 className={cn("text-xl font-bold uppercase tracking-tight", (isPremium || isCurrentPlan) ? "text-white" : "text-neutral-200")}>
                        {plan.name}
                    </h3>
                    <div className="mt-2">
                        {plan.promo ? (
                            <div className="flex flex-col">
                                <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0">
                                    <span className="text-4xl font-black text-white tracking-tight">{plan.promo.price}€</span>
                                    <span className="text-sm font-bold text-green-400 uppercase tracking-wider">Pendant {plan.promo.duration}</span>
                                    <span className="text-xs text-neutral-500 uppercase tracking-widest font-bold">Puis {plan.price}€{plan.period}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white tracking-tight">{plan.price}€</span>
                                <span className="text-sm font-mono text-neutral-500 uppercase">{plan.period}</span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-neutral-400 mt-2 font-medium">{plan.desc}</p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                        <li key={i} className={cn("flex items-start gap-3 text-sm", f.included ? "text-neutral-300" : "text-neutral-600/50")}>
                            {f.included ? (
                                <CheckCircle2 className={cn("size-5 shrink-0",
                                    isCurrentPlan ? "text-green-400" :
                                        isPremium ? "text-blue-400" :
                                            isAnnual ? "text-amber-400" :
                                                "text-white/20"
                                )} />
                            ) : (
                                <X className="size-5 shrink-0" />
                            )}
                            <span className={cn(f.included ? "" : "line-through")}>{f.text}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                {isCurrentPlan ? (
                    <Button disabled={true} className={cn("w-full h-12 font-bold uppercase tracking-wide transition-all duration-300", buttonVariantClass)}>
                        {buttonText} {subscriptionStatus && subscriptionStatus !== 'active' && `(${subscriptionStatus})`}
                    </Button>
                ) : (
                    <Link href={plan.ctaLink} className="block mt-auto">
                        <Button className={cn("w-full h-12 font-bold uppercase tracking-wide transition-all duration-300 group/btn", buttonVariantClass)}>
                            {buttonText} <ArrowRight className="size-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
}
