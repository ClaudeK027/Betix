"use client";

import { use, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Match } from "@/types/match";
import { MatchHero } from "@/components/dashboard/analysis/MatchHero";
import { ConfidenceGauge } from "@/components/dashboard/analysis/ConfidenceGauge";
import { StatBattle } from "@/components/dashboard/analysis/StatBattle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Trophy, Activity, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MatchAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const resolvedParams = use(params);
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchMatch() {
            setLoading(true);
            const { data, error } = await supabase
                .from('matches')
                .select('*')
                .eq('id', resolvedParams.id)
                .single();

            if (data) {
                const dateObj = new Date(data.date_time);
                const transformed: Match = {
                    id: data.id,
                    sport: data.sport,
                    league: {
                        name: data.league_name,
                        country: "International"
                    },
                    homeTeam: {
                        name: data.home_team.name,
                        short: data.home_team.code || data.home_team.name.substring(0, 3).toUpperCase(),
                        logo: data.home_team.logo
                    },
                    awayTeam: {
                        name: data.away_team.name,
                        short: data.away_team.code || data.away_team.name.substring(0, 3).toUpperCase(),
                        logo: data.away_team.logo
                    },
                    date: dateObj.toISOString().split('T')[0],
                    time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                    status: data.status,
                    statusShort: data.status_short,
                    homeScore: data.score?.home,
                    awayScore: data.score?.away,
                    venue: data.venue || "Stadium",
                    predictions: [] // TODO: Fetch from predictions table
                };
                setMatch(transformed);
            }
            setLoading(false);
        }
        if (resolvedParams.id) {
            fetchMatch();
        }
    }, [resolvedParams.id]);

    // Initial loading state for animation
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white/50">Chargement de l'analyse...</div>;
    }

    if (!match) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h1 className="text-2xl font-bold text-white">Match introuvable</h1>
                <Link href="/dashboard">
                    <Button variant="outline">Retour au tableau de bord</Button>
                </Link>
            </div>
        );
    }

    const stats = {
        possession: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        corners: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
    };

    return (
        <div className={`space-y-6 sm:space-y-8 animate-fade-in pb-20 transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>

            {/* Back Navigation */}
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
                <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                <span>Retour aux matchs</span>
            </Link>

            {/* 1. HERO SECTION (The Stadium) */}
            <MatchHero match={match} />

            {/* 2. MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

                {/* LEFT COLUMN (Analysis & Stats) - Spans 8 cols */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">

                    {/* A. AI VERDICT (The Core) */}
                    {match.predictions?.[0] && (
                        <div className="animate-in slide-in-from-bottom-8 duration-700 delay-200">
                            <ConfidenceGauge prediction={match.predictions[0]} />
                        </div>
                    )}

                    {/* B. DATA TABS */}
                    <div className="animate-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Tabs defaultValue="stats" className="w-full">
                            <TabsList className="w-full p-1 bg-black/40 border border-white/10 backdrop-blur-md rounded-xl grid grid-cols-3 mb-6">
                                <TabsTrigger value="stats" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/20 transition-all">
                                    <Activity className="size-4 mr-2" /> Stats Match
                                </TabsTrigger>
                                <TabsTrigger value="h2h" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/20 transition-all">
                                    <Trophy className="size-4 mr-2" /> Forme & H2H
                                </TabsTrigger>
                                <TabsTrigger value="lineups" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/20 transition-all">
                                    <Users className="size-4 mr-2" /> Compos
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB: STATS (The Battle) */}
                            <TabsContent value="stats" className="space-y-6">
                                <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-medium flex items-end gap-2">
                                            <Activity className="size-5 text-primary" />
                                            Duel Statistique
                                            <span className="text-xs font-normal text-muted-foreground ml-auto uppercase tracking-wider">Moy. Saison</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <StatBattle label="Possession" homeValue={stats.possession.home} awayValue={stats.possession.away} showPercent />
                                        <StatBattle label="Tirs" homeValue={stats.shots.home} awayValue={stats.shots.away} />
                                        <StatBattle label="Tirs Cadrés" homeValue={stats.shotsOnTarget.home} awayValue={stats.shotsOnTarget.away} />
                                        <StatBattle label="Corners" homeValue={stats.corners.home} awayValue={stats.corners.away} />
                                        <StatBattle label="Fautes" homeValue={stats.fouls.home} awayValue={stats.fouls.away} />

                                        {/* xG Special Row */}
                                        <div className="pt-4 border-t border-white/5">
                                            <StatBattle label="Expected Goals (xG)" homeValue={0} awayValue={0} />
                                            <p className="text-[10px] text-center text-muted-foreground mt-2">
                                                L&apos;IA calcule les xG basés sur la qualité des occasions créées.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* TAB: H2H */}
                            <TabsContent value="h2h">
                                <Card className="bg-black/40 border-white/10 backdrop-blur-sm h-[400px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Historique des confrontations (À venir)</p>
                                </Card>
                            </TabsContent>

                            {/* TAB: LINEUPS */}
                            <TabsContent value="lineups">
                                <Card className="bg-black/40 border-white/10 backdrop-blur-sm h-[400px] flex items-center justify-center">
                                    <p className="text-muted-foreground">Terrain Tactique 3D (À venir)</p>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* RIGHT COLUMN (Sidebar) - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-6 sm:space-y-8 animate-in slide-in-from-right-8 duration-700 delay-500">

                    {/* Other Predictions */}
                    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="size-4" /> Autres Paris
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {match.predictions?.slice(1).map((pred, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded uppercase",
                                            pred.level === "safe" ? "bg-emerald-500/10 text-emerald-400" :
                                                pred.level === "value" ? "bg-purple-500/10 text-purple-400" :
                                                    "bg-orange-500/10 text-orange-400"
                                        )}>
                                            {pred.level}
                                        </span>
                                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">@{pred.odds.toFixed(2)}</span>
                                    </div>
                                    <div className="text-sm font-medium text-white">{pred.bet}</div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{pred.analysis}</div>
                                </div>
                            ))}
                            {(!match.predictions || match.predictions.length <= 1) && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    Aucune autre prédiction disponible pour le moment.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Promo Box */}
                    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-transparent p-6 text-center space-y-4">
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <Trophy className="size-20 text-primary rotate-12" />
                        </div>
                        <h3 className="text-lg font-bold text-white relative z-10">Passez Premium 👑</h3>
                        <p className="text-xs text-muted-foreground relative z-10">
                            Débloquez les analyses détaillées, les xG en temps réel et les alertes valuebet.
                        </p>
                        <Button className="w-full bg-primary text-black hover:bg-primary/90 font-bold relative z-10">
                            Essayer Gratuitement
                        </Button>
                    </div>

                </div>

            </div>
        </div>
    );
}
