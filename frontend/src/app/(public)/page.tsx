import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowRight,
    BarChart3,
    Bot,
    CheckCircle2,
    Clock,
    LineChart,
    Shield,
    Sparkles,
    Star,
    Target,
    Zap,
    Trophy,
    TrendingUp,
    Activity
} from "lucide-react";
import { FootballIcon, BasketballIcon, TennisIcon } from "@/components/icons/SportIcons";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { TextReveal } from "@/components/ui/text-reveal";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Spotlight } from "@/components/ui/card-spotlight";
import { BreathingGauge } from "@/components/ui/breathing-gauge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

/* ================================================================
   Landing Page — BETIX Premium (Refonte Wow)
   ================================================================ */

export default async function LandingPage() {
    const supabase = await createClient();

    // Fetch Plans for preview (Filter for 2 non-yearly active plans)
    const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .neq('frequency', 'yearly')
        .order('position', { ascending: true })
        .limit(2);

    // Fetch Definitions for labels
    const { data: definitions } = await supabase
        .from('feature_definitions')
        .select('*');
    return (
        <div className="relative overflow-hidden bg-background text-foreground">
            {/* ====== HERO ====== */}
            <AuroraBackground>
                <div className="relative z-10 container mx-auto text-center max-w-5xl px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
                    {/* Floating badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm text-primary mb-8 animate-fade-in shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]">
                        <Sparkles className="size-3.5" />
                        <span>IA sur une série de 7 pronos justes en Premier League</span>
                    </div>

                    <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 animate-slide-up">
                        De la Data brute à la
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-gradient-x">
                            Stratégie gagnante
                        </span>
                    </h1>

                    <TextReveal
                        words="Pronostics sportifs propulsés par l'Intelligence Artificielle. Analyses transparentes. Zéro bullshit."
                        className="text-base sm:text-xl text-white max-w-2xl mx-auto mb-10"
                    />

                    {/* CTA Group */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up w-full sm:w-auto" style={{ animationDelay: "0.2s" }}>
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:scale-105">
                                Débuter maintenant
                                <ArrowRight className="size-5" />
                            </Button>
                        </Link>
                        <Link href="#demo">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full w-full sm:w-auto gap-2 border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all hover:scale-105">
                                <Target className="size-5" />
                                Voir une démo
                            </Button>
                        </Link>
                    </div>

                    {/* Hero Visual Element (Floating 3D-ish) */}
                    <div className="mt-16 w-full max-w-5xl mx-auto perspective-1000">
                        {/* Live Ticker Placeholder (Simulated) */}
                        <div className="w-full overflow-hidden bg-white/5 backdrop-blur-sm border-y border-white/5 py-3 mask-linear-fade">
                            <div className="flex gap-8 whitespace-nowrap animate-marquee text-xs font-mono text-muted-foreground/80 hover:text-foreground transition-colors">
                                {/* Set 1 */}
                                <div className="flex gap-8 items-center">
                                    <span className="flex items-center gap-2"><TrendingUp className="size-3 text-safe" /> Alex vient de gagner 150€ (Cote 2.10)</span>
                                    <span className="flex items-center gap-2"><CheckCircle2 className="size-3 text-value" /> Thomas a validé PSG +1.5 buts</span>
                                    <span className="flex items-center gap-2"><BarChart3 className="size-3 text-primary" /> Taux de réussite hier : 87%</span>
                                    <span className="flex items-center gap-2"><Activity className="size-3 text-red-400 animate-pulse" /> Live : Arsenal ouvre le score (14')</span>
                                    <span className="flex items-center gap-2"><Zap className="size-3 text-yellow-400" /> Karim +45€ sur NBA</span>
                                    <span className="flex items-center gap-2"><Sparkles className="size-3 text-indigo-400" /> Nouveau prono Value disponible</span>
                                </div>
                                {/* Set 2 (Duplicate for loop) */}
                                <div className="flex gap-8 items-center">
                                    <span className="flex items-center gap-2"><TrendingUp className="size-3 text-safe" /> Alex vient de gagner 150€ (Cote 2.10)</span>
                                    <span className="flex items-center gap-2"><CheckCircle2 className="size-3 text-value" /> Thomas a validé PSG +1.5 buts</span>
                                    <span className="flex items-center gap-2"><BarChart3 className="size-3 text-primary" /> Taux de réussite hier : 87%</span>
                                    <span className="flex items-center gap-2"><Activity className="size-3 text-red-400 animate-pulse" /> Live : Arsenal ouvre le score (14')</span>
                                    <span className="flex items-center gap-2"><Zap className="size-3 text-yellow-400" /> Karim +45€ sur NBA</span>
                                    <span className="flex items-center gap-2"><Sparkles className="size-3 text-indigo-400" /> Nouveau prono Value disponible</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuroraBackground>

            {/* ====== FEATURES (Bento Grid) ====== */}
            <section id="features" className="py-12 md:py-24 px-4 bg-black relative">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
                            <Zap className="size-3 mr-1.5" /> Intelligence Artificielle
                        </Badge>
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            Bâti pour la performance.
                        </h2>
                    </div>

                    <BentoGrid>
                        <BentoGridItem
                            title="Collecte de Données Massive"
                            description="Notre moteur ingère des millions de points de données : classements, forme, xG, absences, météo..."
                            header={
                                <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex flex-col gap-2 p-4 border border-white/5 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                                    {/* Simulated Data Stream */}
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="flex gap-2 items-center opacity-50 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <div className="h-2 w-full bg-white/10 rounded-full" />
                                            <div className="h-2 w-12 bg-white/10 rounded-full" />
                                        </div>
                                    ))}
                                    <div className="mt-auto flex gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <div className="h-1 w-1 bg-blue-400 rounded-full animate-ping" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                                            <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<BarChart3 className="h-4 w-4 text-neutral-500" />}
                        />
                        <BentoGridItem
                            title="Analyses en Temps Réel"
                            description="L'algo s'adapte à la seconde. Une compo change ? La prédiction évolue."
                            header={
                                <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-end justify-between p-4 border border-white/5 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-50" />
                                    {[40, 60, 55, 80, 70, 90].map((h, i) => (
                                        <div key={i} className="w-1/6 mx-0.5 bg-green-500/20 rounded-t-sm relative group overflow-hidden" style={{ height: `${h}%` }}>
                                            <div className="absolute inset-0 bg-green-400/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            }
                            className="md:col-span-1"
                            icon={<Clock className="h-4 w-4 text-neutral-500" />}
                        />
                        <BentoGridItem
                            title="3 Niveaux de Risque"
                            description="Safe, Value, Risky. Choisissez votre stratégie selon votre profil de parieur."
                            header={
                                <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4 border border-white/5 relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                            <div className="w-2 h-2 bg-white/20 rounded-full absolute -top-1" />
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center animate-[spin_7s_linear_infinite_reverse]">
                                            <div className="w-2 h-2 bg-white/20 rounded-full absolute -top-1" />
                                        </div>
                                    </div>
                                    <Target className="size-8 text-primary relative z-10" />
                                </div>
                            }
                            className="md:col-span-1"
                            icon={<Target className="h-4 w-4 text-neutral-500" />}
                        />
                        <BentoGridItem
                            title="Transparence Totale"
                            description="Pas de boîte noire. Chaque prédiction est expliquée avec des arguments clairs et vérifiables."
                            header={
                                <div className="flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center border border-white/5 overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-grid-white/[0.05]" />
                                    <div className="absolute top-0 right-0 p-4 opacity-20 font-mono text-xs text-green-400">
                                        {`{
  "confidence": 0.89,
  "status": "verified"
}`}
                                    </div>
                                    <Shield className="size-12 text-emerald-500/50 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-300" />
                                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500/50 w-full animate-scan" />
                                    </div>
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<Shield className="h-4 w-4 text-neutral-500" />}
                        />
                    </BentoGrid>
                </div>
            </section>

            {/* ====== DEMO PREDICTOR (Spotlight) ====== */}
            <section id="demo" className="py-12 md:py-24 px-4 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
                            <Sparkles className="size-3 mr-1.5" /> Démo Interactive
                        </Badge>
                        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                            Voyez l'IA respirer.
                        </h2>
                    </div>

                    <Spotlight className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-0 overflow-hidden">
                        <div className="p-6 sm:p-10">
                            {/* Match Header */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-sm font-bold text-red-400">ARS</div>
                                    <span className="text-2xl font-bold tracking-tight">Arsenal</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Premier League</span>
                                    <span className="text-3xl font-bold font-mono">21:00</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold tracking-tight">Man City</span>
                                    <div className="size-12 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sm font-bold text-sky-400">MCI</div>
                                </div>
                            </div>

                            {/* Predictions Tabs */}
                            <Tabs defaultValue="safe" className="mt-8">
                                <TabsList className="grid grid-cols-3 mb-8 bg-white/5 border border-white/5 p-1 rounded-full h-auto">
                                    <TabsTrigger value="safe" className="rounded-full py-2 data-[state=active]:bg-safe data-[state=active]:text-black transition-all">
                                        Safe
                                    </TabsTrigger>
                                    <TabsTrigger value="value" className="rounded-full py-2 data-[state=active]:bg-value data-[state=active]:text-black transition-all">
                                        Value
                                    </TabsTrigger>
                                    <TabsTrigger value="risky" className="rounded-full py-2 data-[state=active]:bg-risky data-[state=active]:text-white transition-all">
                                        Risky
                                    </TabsTrigger>
                                </TabsList>

                                {[
                                    {
                                        key: "safe",
                                        pct: 89,
                                        outcome: "Plus de 1.5 buts",
                                        odds: "1.35",
                                        color: "text-safe",
                                        analysis: "Les deux équipes ont une moyenne combinée de 3.2 buts par match cette saison. Arsenal marque à domicile dans 92% de ses matchs.",
                                    },
                                    {
                                        key: "value",
                                        pct: 68,
                                        outcome: "Les deux marquent",
                                        odds: "1.72",
                                        color: "text-value",
                                        analysis: "Man City a marqué dans 85% de ses déplacements. Arsenal a encaissé dans 6 de ses 8 derniers matchs à domicile.",
                                    },
                                    {
                                        key: "risky",
                                        pct: 42,
                                        outcome: "Arsenal gagne 2-1",
                                        odds: "8.50",
                                        color: "text-risky",
                                        analysis: "Score exact plus risqué mais Arsenal a gagné 2-1 dans 3 de ses 5 derniers matchs à domicile face au Top 6.",
                                    },
                                ].map((pred) => (
                                    <TabsContent key={pred.key} value={pred.key} className="mt-0 animate-fade-in shadow-none">
                                        <div className="flex flex-col md:flex-row items-center gap-10">
                                            {/* Breathing Gauge */}
                                            <div className="shrink-0 scale-110">
                                                <BreathingGauge value={pred.pct} />
                                            </div>

                                            <div className="flex-1 text-center md:text-left space-y-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold mb-1">{pred.outcome}</h3>
                                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono">
                                                        Cote : {pred.odds}
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed text-lg">
                                                    {pred.analysis}
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </Spotlight>
                </div>
            </section>

            {/* ====== SPORT SHOWCASE ====== */}
            <section id="sports" className="py-12 md:py-24 px-4 bg-background">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Tous vos sports.<br />
                                <span className="text-muted-foreground">Une seule intelligence.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Que vous soyez expert du ballon rond ou passionné de la balle jaune, BETIX adapte ses algorithmes aux spécificités de chaque discipline.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: <FootballIcon className="text-green-400" />, label: "Football : xG, Forme, Absences" },
                                    { icon: <BasketballIcon className="text-orange-400" />, label: "Basketball : Pace, Efficacité, Matchups" },
                                    { icon: <TennisIcon className="text-yellow-400" />, label: "Tennis : Surface, H2H, Fatigue" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="p-2 bg-white/5 rounded-lg">{item.icon}</div>
                                        <span className="font-medium">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-[300px] sm:h-[500px] w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl border border-white/10 overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-white/[0.05]" />
                            {/* Decorative blurred shapes */}
                            <div className="absolute top-1/4 left-1/4 size-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                            <div className="absolute bottom-1/4 right-1/4 size-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <Trophy className="size-24 text-white/20 mx-auto" />
                                    <p className="text-sm font-mono text-white/30 uppercase tracking-widest">Couverture Mondiale</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== PRICING (Simpler for flow) ====== */}
            <section id="pricing" className="py-12 md:py-24 px-4 bg-black relative">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                        Commencez petit. Gagnez gros.
                    </h2>
                    <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                        Pas de frais cachés. Annulable à tout moment. Investissez dans votre réussite.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                        {plans?.map((plan) => {
                            const isPremium = plan.frequency !== 'free';

                            // Get first 2 features from 'core' category
                            const planFeatures = Object.entries(plan.features?.core || {}).slice(0, 2);

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden group",
                                        isPremium
                                            ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                                            : "border-white/5 bg-neutral-900/50 hover:bg-neutral-900"
                                    )}
                                >
                                    {isPremium && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    <div className="relative z-10">
                                        <div className="mb-4 text-muted-foreground font-mono text-sm uppercase tracking-wider flex justify-between items-center">
                                            <span>{plan.name}</span>
                                        </div>

                                        <div className="text-4xl font-bold text-white mb-2">
                                            {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                                            {plan.frequency !== 'free' && (
                                                <span className="text-base font-normal text-muted-foreground ml-1">
                                                    /{plan.frequency === 'monthly' ? 'mois' : plan.frequency === 'weekly' ? 'semaine' : plan.frequency}
                                                </span>
                                            )}
                                        </div>

                                        <p className={cn("text-sm mb-8", isPremium ? "text-blue-200/60" : "text-muted-foreground")}>
                                            {plan.description || (isPremium ? "Accès illimité à l'intelligence artificielle." : "Pour tester la puissance de l'IA.")}
                                        </p>

                                        <ul className="space-y-3 mb-8">
                                            {planFeatures.map(([key, val]) => {
                                                const def = definitions?.find(d => d.id === key);
                                                const label = def?.label || key;
                                                const displayValue = typeof val === 'object' ? (val as any).value : val;

                                                return (
                                                    <li key={key} className="flex items-center gap-3 text-sm">
                                                        <CheckCircle2 className={cn("size-4", isPremium ? "text-blue-400" : "text-neutral-600")} />
                                                        <span>{label} : <span className="font-bold">{displayValue === true ? "Inclus" : displayValue}</span></span>
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        <Link href="/signup">
                                            <Button
                                                className={cn(
                                                    "w-full transition-all",
                                                    isPremium ? "bg-blue-600 hover:bg-blue-700 text-white border-0" : ""
                                                )}
                                                variant={isPremium ? "default" : "outline"}
                                            >
                                                Débuter
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <Link href="/pricing">
                            <Button size="lg" variant="outline" className="rounded-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all hover:scale-105 px-8 h-12">
                                Voir le détail des offres <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ====== FINAL CTA ====== */}
            <section className="py-12 md:py-24 px-4 bg-background relative overflow-hidden">
                <div className="container mx-auto max-w-2xl text-center relative z-10">
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-8">
                        Ne pariez plus seul.
                    </h2>
                    <Link href="/signup">
                        <Button size="lg" className="h-16 px-10 text-xl rounded-full w-full sm:w-auto gap-3 bg-white text-black hover:bg-neutral-200 border-0 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
                            Rejoindre BETIX
                            <ArrowRight className="size-6" />
                        </Button>
                    </Link>
                </div>
                {/* Footer Aurora */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-500/10 to-transparent blur-3xl pointer-events-none" />
            </section>
        </div>
    );
}
