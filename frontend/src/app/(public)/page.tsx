import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BetixLogo } from "@/components/ui/betix-logo";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Database,
    LockKeyhole,
    BrainCircuit,
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
    Activity,
    Users,
    ShieldCheck
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
        .neq('id', 'no_subscription')
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
                    {/* Mobile Full Logo (User Request) */}
                    <div className="block md:hidden mb-12 animate-fade-in">
                        <BetixLogo className="h-10 mx-auto justify-center" />
                    </div>



                    <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 animate-slide-up">
                        L'IA qui révolutionne
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-gradient-x">
                            vos paris sportifs
                        </span>
                    </h1>

                    <TextReveal
                        words="Des milliers de statistiques analysées en temps réel pour des pronostics ultra-précis."
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

                    {/* Social Proof */}
                    <div className="mt-8 md:mt-12 flex flex-col items-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                        {/* Rating Row */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="size-5 sm:size-6 fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
                                ))}
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-blue-400 ml-1">4.8</span>
                            <span className="text-muted-foreground text-sm flex items-center gap-1 lg:text-base ml-2 font-medium">
                                Noté sur <span className="text-white">377 utilisateurs</span>
                            </span>
                        </div>

                        {/* Trust Row */}
                        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-1">
                            <div className="flex items-center gap-2">
                                <Users className="size-5 sm:size-6 text-blue-500" />
                                <span className="text-white/90 text-sm sm:text-base font-medium">+500 parieurs actifs</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-5 sm:size-6 text-blue-500" />
                                <span className="text-white/90 text-sm sm:text-base font-medium">Paiement sécurisé</span>
                            </div>
                        </div>
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
                        {/* 1. Collecte de Données (Le Cerveau Connecté) */}
                        <BentoGridItem
                            title="Collecte de Données Massive"
                            description="Notre moteur ingère des millions de points de données : classements, forme, xG, absences, météo..."
                            header={
                                <div className="flex-1 w-full h-full min-h-[12rem] md:min-h-full rounded-xl flex items-center justify-center p-4 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-grid-white/[0.02]" />
                                    {/* Central glowing hub */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-100 transition-opacity duration-1000" />

                                    {/* Connection Lines & Data Nodes */}
                                    <div className="absolute inset-0">
                                        {[
                                            { t: '20%', l: '20%', tx: '50%', ty: '50%', d: '0s' },
                                            { t: '20%', l: '80%', tx: '-50%', ty: '50%', d: '1s' },
                                            { t: '80%', l: '20%', tx: '50%', ty: '-50%', d: '2s' },
                                            { t: '80%', l: '80%', tx: '-50%', ty: '-50%', d: '3s' }
                                        ].map((node, i) => (
                                            <div key={i} className="absolute" style={{ top: node.t, left: node.l }}>
                                                {/* Node */}
                                                <div className="size-2 bg-blue-500/50 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
                                                {/* Moving Data Packet */}
                                                <div
                                                    className="absolute top-1 left-1 size-1 bg-white rounded-full shadow-[0_0_5px_#fff]"
                                                    style={{
                                                        animation: `moveData 4s infinite ${node.d} ease-in-out`,
                                                    }}
                                                />
                                                <style dangerouslySetInnerHTML={{
                                                    __html: `
                                                    @keyframes moveData {
                                                        0% { transform: translate(0, 0); opacity: 0; }
                                                        20% { opacity: 1; }
                                                        80% { opacity: 1; }
                                                        100% { transform: translate(calc(${node.tx} * 4), calc(${node.ty} * 4)); opacity: 0; }
                                                    }
                                                `}} />
                                            </div>
                                        ))}
                                    </div>
                                    <Database className="size-10 text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] relative z-10 hover:scale-110 transition-transform duration-700" />
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<Database className="h-4 w-4 text-neutral-500" />}
                        />

                        {/* 2. Haut Niveau de Sécurité (Le radar) */}
                        <BentoGridItem
                            title="Haut Niveau de Sécurité"
                            description="Transactions cryptées (Stripe/Mollie) et protection absolue de vos données personnelles."
                            header={
                                <div className="flex-1 w-full h-full min-h-[12rem] md:min-h-full rounded-xl flex items-center justify-center relative overflow-hidden group">
                                    {/* Radar Background */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-80 transition-opacity duration-1000">
                                        <div className="w-32 h-32 rounded-full border border-emerald-500/30" />
                                        <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />
                                        <div className="absolute w-16 h-16 rounded-full border border-emerald-500/10" />

                                        {/* Sweeper */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-transparent to-transparent animate-[spin_4s_linear_infinite]" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

                                    <LockKeyhole className="size-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] relative z-10 hover:scale-110 transition-transform duration-500" />
                                </div>
                            }
                            className="md:col-span-1"
                            icon={<Shield className="h-4 w-4 text-neutral-500" />}
                        />

                        {/* 3. 3 Niveaux de Risque (Le Compteur) */}
                        <BentoGridItem
                            title="3 Niveaux de Risque"
                            description="Safe, Value, Risky. Choisissez votre stratégie selon votre profil de parieur."
                            header={
                                <div className="flex-1 w-full h-full min-h-[12rem] md:min-h-full rounded-xl flex flex-col items-center justify-end pb-6 relative group overflow-hidden">
                                    <div className="relative w-32 h-16 overflow-hidden">
                                        {/* Gauge Arc */}
                                        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[10px] border-transparent border-t-safe/50 border-r-value/50 border-b-risky/50 border-l-safe/50 rotate-[-45deg] opacity-100 transition-opacity duration-700" />

                                        {/* Needle */}
                                        <div className="absolute bottom-0 left-1/2 w-1 h-14 bg-white/80 origin-bottom rounded-t-full -translate-x-1/2 transform transition-transform duration-[2000ms] ease-in-out shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ animation: "gaugeSweep 6s infinite alternate ease-in-out" }} />
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                                @keyframes gaugeSweep {
                                                    0% { transform: translateX(-50%) rotate(-60deg); }
                                                    50% { transform: translateX(-50%) rotate(0deg); }
                                                    100% { transform: translateX(-50%) rotate(60deg); }
                                                }
                                            `
                                        }} />
                                        {/* Center Pin */}
                                        <div className="absolute bottom-[-4px] left-1/2 size-3 bg-white rounded-full -translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,1)]" />
                                    </div>
                                    <div className="mt-4 flex gap-4 text-[10px] font-mono text-white/80 transition-colors">
                                        <span className="text-safe">SAFE</span>
                                        <span className="text-value">VALUE</span>
                                        <span className="text-risky">RISKY</span>
                                    </div>
                                </div>
                            }
                            className="md:col-span-1"
                            icon={<Target className="h-4 w-4 text-neutral-500" />}
                        />

                        {/* 4. Transparence Totale (Le Terminal IA) */}
                        <BentoGridItem
                            title="Transparence Totale"
                            description="Pas de boîte noire. Chaque prédiction est expliquée."
                            header={
                                <div className="flex-1 w-full h-full min-h-[12rem] md:min-h-full rounded-xl flex flex-col overflow-hidden relative group">
                                    {/* Mac OS Header */}
                                    <div className="h-6 bg-white-5 w-full flex items-center px-3 border-b border-white/10 gap-1.5">
                                        <div className="size-2 rounded-full bg-red-500/50" />
                                        <div className="size-2 rounded-full bg-yellow-500/50" />
                                        <div className="size-2 rounded-full bg-green-500/50" />
                                    </div>
                                    {/* Terminal Content */}
                                    <div className="relative flex-1 p-4 font-mono text-xs text-left text-neutral-400 overflow-hidden">
                                        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
                                        <div className="flex flex-col" style={{ animation: 'terminal-scroll 15s linear infinite' }}>
                                            <style dangerouslySetInnerHTML={{
                                                __html: `
                                                @keyframes terminal-scroll {
                                                    0% { transform: translateY(0); }
                                                    100% { transform: translateY(-50%); }
                                                }
                                                `
                                            }} />
                                            {[1, 2].map((cycle) => (
                                                <div key={cycle} className="flex flex-col gap-5 pb-5">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <BrainCircuit className="size-4 text-purple-400" />
                                                            <span className="text-purple-400">betix_ai_core ~ % analyzing</span>
                                                        </div>
                                                        <div className="text-white/80">
                                                            {"{"}<br />
                                                            &nbsp;&nbsp;<span className="text-blue-400">"confidence"</span>: <span className="text-green-400">0.89</span>,<br />
                                                            &nbsp;&nbsp;<span className="text-blue-400">"reasoning"</span>: <span className="text-yellow-400">"xG delta favorable"</span><br />
                                                            {"}"}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Activity className="size-4 text-emerald-400" />
                                                            <span className="text-emerald-400">betix_ai_core ~ % checking_injuries</span>
                                                        </div>
                                                        <div className="text-white/80">
                                                            [<span className="text-emerald-400">OK</span>] 0 absents majeurs
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Target className="size-4 text-blue-400" />
                                                            <span className="text-blue-400">betix_ai_core ~ % calc_value</span>
                                                        </div>
                                                        <div className="text-white/80">
                                                            Value trouvée: <span className="text-green-400">+1.2%</span> EV+
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Scanline overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />
                                </div>
                            }
                            className="md:col-span-2"
                            icon={<BrainCircuit className="h-4 w-4 text-neutral-500" />}
                        />
                    </BentoGrid>
                </div>
            </section>

            {/* ====== DEMO PREDICTOR (Spotlight) ====== */}
            <section id="demo" className="py-12 md:py-24 px-4 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
                <div className="container mx-auto max-w-4xl relative z-10">
                    <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
                        <Sparkles className="size-3 mr-1.5" /> Démo Interactive
                    </Badge>

                    <Spotlight className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl p-0 overflow-hidden">
                        <div className="p-4 sm:p-10">
                            {/* Match Header */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="size-12 sm:size-16 relative flex shrink-0 items-center justify-center bg-white/5 rounded-full border border-white/10 p-1.5 sm:p-2 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                        <img src="https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg" alt="Arsenal" className="w-full h-full object-contain drop-shadow-md" />
                                    </div>
                                    <span className="text-2xl sm:text-3xl font-bold tracking-tight">Arsenal</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Premier League</span>
                                    <span className="text-3xl sm:text-4xl font-bold font-mono text-white/90">21:00</span>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <span className="text-2xl sm:text-3xl font-bold tracking-tight">Man City</span>
                                    <div className="size-12 sm:size-16 relative flex shrink-0 items-center justify-center bg-white/5 rounded-full border border-white/10 p-1.5 sm:p-2 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                        <img src="https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" alt="Man City" className="w-full h-full object-contain drop-shadow-md" />
                                    </div>
                                </div>
                            </div>

                            {/* Predictions Tabs */}
                            <Tabs defaultValue="safe" className="mt-8">
                                <div className="flex justify-center mb-8 sm:mb-12">
                                    <TabsList className="flex flex-wrap items-center justify-center bg-black/40 border border-white/10 p-1.5 rounded-3xl sm:rounded-full gap-2 backdrop-blur-md h-auto">
                                        <TabsTrigger value="safe" className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/50 data-[state=active]:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                            Safe
                                        </TabsTrigger>
                                        <TabsTrigger value="value" className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border data-[state=active]:border-blue-500/50 data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                            Value
                                        </TabsTrigger>
                                        <TabsTrigger value="risky" className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 data-[state=active]:border data-[state=active]:border-rose-500/50 data-[state=active]:shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                            Risky
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

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
                                        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
                                            {/* Breathing Gauge */}
                                            <div className="shrink-0 scale-125 md:scale-150 pl-4 py-8">
                                                <BreathingGauge value={pred.pct} />
                                            </div>

                                            <div className="flex-1 text-center md:text-left space-y-5 max-w-md">
                                                <div>
                                                    <h3 className="text-3xl font-bold mb-3">{pred.outcome}</h3>
                                                    <div className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-mono text-white/80">
                                                        Cote médiane : <span className="text-white ml-2 font-bold">{pred.odds}</span>
                                                    </div>
                                                </div>
                                                <p className="text-neutral-400 leading-relaxed text-lg">
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
            </section >

            {/* ====== SPORT SHOWCASE ====== */}
            < section id="sports" className="py-12 md:py-24 px-4 bg-background" >
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
                        <div className="relative min-h-[480px] sm:min-h-[500px] h-auto w-full bg-black/40 rounded-3xl border border-white/10 overflow-hidden group flex flex-col p-6 lg:p-10 shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]">
                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />

                            {/* Glows */}
                            <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-auto">
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                                        <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-mono text-white/80 tracking-wider">LIVE FEED</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-mono border-white/10 bg-white/5 text-muted-foreground">SCANNING</Badge>
                                </div>

                                {/* Abstract Radial Scanner */}
                                <div className="flex-1 flex items-center justify-center relative w-full my-8 scale-90 sm:scale-100">
                                    <div className="relative size-40 sm:size-56 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-2 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
                                        <div className="absolute inset-8 rounded-full border border-white/5" />
                                        <div className="absolute inset-14 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm" />

                                        {/* Radar Sweep */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-transparent animate-[spin_3s_linear_infinite] origin-center" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }} />

                                        {/* Data Nodes */}
                                        <div className="absolute size-2 bg-emerald-400 rounded-full top-[25%] left-[30%] shadow-[0_0_15px_#34d399]" style={{ animation: "float-1 4s ease-in-out infinite" }} />
                                        <div className="absolute size-1.5 bg-blue-400 rounded-full bottom-[30%] right-[25%] shadow-[0_0_10px_#60a5fa]" style={{ animation: "float-2 5s ease-in-out infinite" }} />
                                        <div className="absolute size-2 bg-rose-400 rounded-full top-[60%] left-[65%] shadow-[0_0_15px_#fb7185]" style={{ animation: "float-3 6s ease-in-out infinite" }} />

                                        <Activity className="size-8 text-blue-400/50 relative z-10" />
                                    </div>
                                </div>

                                {/* Streaming Data lines */}
                                <div className="mt-auto space-y-3">
                                    <style dangerouslySetInnerHTML={{
                                        __html: `
                                        @keyframes progress-1 { 0% { width: 60%; } 25% { width: 85%; } 50% { width: 75%; } 75% { width: 95%; } 100% { width: 60%; } }
                                        @keyframes progress-2 { 0% { width: 90%; } 30% { width: 100%; } 70% { width: 85%; } 100% { width: 90%; } }
                                        @keyframes progress-3 { 0% { width: 40%; } 33% { width: 70%; } 66% { width: 50%; } 100% { width: 40%; } }
                                        @keyframes float-1 { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; } 50% { transform: translate(-10px, 15px) scale(1.5); opacity: 1; } }
                                        @keyframes float-2 { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; } 50% { transform: translate(15px, -10px) scale(1.5); opacity: 1; } }
                                        @keyframes float-3 { 0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; } 50% { transform: translate(-15px, -15px) scale(1.5); opacity: 1; } }
                                        @keyframes loading-dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } 100% { content: ''; } }
                                        .anim-dots::after { content: ''; animation: loading-dots 2s infinite steps(1); }
                                        `
                                    }} />
                                    {[
                                        { label: "Analyse xG en cours", anim: "progress-1 6s infinite ease-in-out", color: "from-blue-500 to-cyan-400" },
                                        { label: "Mise à jour des cotes en direct", anim: "progress-2 8s infinite ease-in-out", color: "from-emerald-500 to-green-400" },
                                        { label: "Corrélation H2H", anim: "progress-3 5s infinite ease-in-out", color: "from-purple-500 to-indigo-400" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-2 backdrop-blur-md">
                                            <div className="flex justify-between items-center text-[10px] sm:text-xs text-neutral-400 font-mono tracking-wider">
                                                <span className="anim-dots">{stat.label}</span>
                                                <Activity className="size-3 text-white/40 animate-pulse" />
                                            </div>
                                            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r ${stat.color} rounded-full`} style={{ animation: stat.anim }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* ====== PRICING (Simpler for flow) ====== */}
            < section id="pricing" className="py-12 md:py-24 px-4 bg-black relative" >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-6">
                        Commencez petit. Gagnez gros.
                    </h2>
                    <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                        Pas de frais cachés. Annulable à tout moment. Investissez dans votre réussite.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
                        {(() => {
                            // Sort plans by price ascending before mapping
                            const sortedPlans = [...(plans || [])].sort((a, b) => a.price - b.price);

                            return sortedPlans.map((plan) => {
                                const isPremium = plan.frequency !== 'free';

                                // Get first 2 features from 'core' category
                                const planFeatures = Object.entries(plan.features?.core || {}).slice(0, 2);

                                // Format frequency display
                                let periodDisplay = plan.frequency;
                                if (plan.frequency === 'monthly') periodDisplay = 'mois';
                                else if (plan.frequency === 'semi_annual') periodDisplay = 'semestre';
                                else if (plan.frequency === 'yearly') periodDisplay = 'an';
                                else if (plan.frequency === 'weekly') periodDisplay = 'semaine';

                                return (
                                    <div
                                        key={plan.id}
                                        className={cn(
                                            "p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden group",
                                            isPremium
                                                ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                                                : "border-white/5 bg-neutral-900/50 hover:bg-neutral-900"
                                        )}
                                    >                       {isPremium && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}

                                        <div className="relative z-10">
                                            <div className="mb-4 text-muted-foreground font-mono text-sm uppercase tracking-wider flex justify-between items-center">
                                                <span>{plan.name}</span>
                                            </div>

                                            {plan.trial_days && plan.trial_days > 0 && (
                                                <Badge className="mb-4 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                                                    {plan.trial_days} jours d&apos;essai gratuit
                                                </Badge>
                                            )}

                                            <div className="flex items-center gap-2 mb-1">
                                                {plan.strikethrough_price && plan.strikethrough_price > plan.price && (
                                                    <span className="text-xl sm:text-2xl font-bold text-muted-foreground line-through opacity-70">
                                                        {plan.strikethrough_price}€
                                                    </span>
                                                )}
                                                <div className="text-4xl font-bold text-white">
                                                    {plan.price === 0 ? "Gratuit" : `${plan.price}€`}
                                                    {plan.frequency !== 'free' && (
                                                        <span className="text-base font-normal text-muted-foreground ml-1">
                                                            /{periodDisplay}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p className={cn("text-sm mb-8 mt-2", isPremium ? "text-blue-200/60" : "text-muted-foreground")}>
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
                            });
                        })()}
                    </div>

                    <div className="mt-12 flex justify-center">
                        <Link href="/pricing">
                            <Button size="lg" variant="outline" className="rounded-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all hover:scale-105 px-8 h-12">
                                Voir le détail des offres <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section >

            {/* ====== FINAL CTA ====== */}
            < section className="py-12 md:py-24 px-4 bg-background relative overflow-hidden" >
                <div className="container mx-auto max-w-2xl text-center relative z-10">
                    <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-8">
                        Ne pariez plus seul.
                    </h2>
                    <Link href="/signup">
                        <div className="relative inline-block w-full sm:w-auto group mt-8">
                            {/* Animated Glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 group-hover:blur-xl transition-all duration-500 animate-gradient-x" />

                            <Button
                                size="lg"
                                className="relative h-16 sm:h-20 px-10 sm:px-14 text-xl sm:text-2xl font-extrabold rounded-full w-full sm:w-auto gap-4 bg-white hover:bg-neutral-50 text-black border-0 transition-all duration-500 hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(255,255,255,0.8)]"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    Rejoindre BETIX
                                    <div className="bg-black text-white rounded-full p-1.5 group-hover:translate-x-2 transition-transform duration-300">
                                        <ArrowRight className="size-5 sm:size-6" />
                                    </div>
                                </span>
                            </Button>
                        </div>
                    </Link>
                </div>
                {/* Footer Aurora */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-500/10 to-transparent blur-3xl pointer-events-none" />
            </section >
        </div >
    );
}
