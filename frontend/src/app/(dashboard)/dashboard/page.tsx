"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, LayoutGrid, List, ChevronDown, Search, Swords, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { MatchCard } from "@/components/dashboard/MatchCard";
import { MatchTable } from "@/components/dashboard/MatchTable";
import { cn } from "@/lib/utils";
import { Match } from "@/types/match";

export default function DashboardPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [visibleCount, setVisibleCount] = useState(6);
    const [searchTeamA, setSearchTeamA] = useState("");
    const [searchTeamB, setSearchTeamB] = useState("");
    const [matches, setMatches] = useState<Match[]>([]);
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const searchParams = useSearchParams();
    const currentSport = searchParams.get("sport") || "all";

    // Imports for Client Side Fetch
    const supabase = createClient();

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('matches')
                .select('*')
                .order('date_time', { ascending: true });

            if (error) {
                console.error("Error fetching matches:", error);
                return;
            }

            if (data) {
                // Transform DB shape to UI Type
                const transformed: Match[] = data.map((m: any) => {
                    const dateObj = new Date(m.date_time);
                    return {
                        id: m.id,
                        sport: m.sport,
                        league: {
                            name: m.league_name,
                            country: "International"
                        },
                        homeTeam: {
                            name: m.home_team.name,
                            short: m.home_team.code || m.home_team.name.substring(0, 3).toUpperCase(),
                            logo: m.home_team.logo
                        },
                        awayTeam: {
                            name: m.away_team.name,
                            short: m.away_team.code || m.away_team.name.substring(0, 3).toUpperCase(),
                            logo: m.away_team.logo
                        },
                        date: dateObj.toISOString().split('T')[0],
                        time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                        status: m.status,
                        statusShort: m.status_short,
                        homeScore: m.score?.home,
                        awayScore: m.score?.away,
                        venue: m.venue || "Stadium",
                        predictions: []
                    };
                });
                setMatches(transformed);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();

        // --- Activation Supabase Realtime ---
        // On écoute tout changement sur la table 'matches' du schéma 'public'
        const channel = supabase
            .channel('realtime_matches')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'matches'
                },
                (payload) => {
                    console.log('Realtime change received:', payload);
                    // On pourrait optimiser en injectant juste la ligne,
                    // mais refetchMatches garantit la cohérence et le transform UI correct.
                    fetchMatches();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSport]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/matches/refresh`, {
                method: 'POST',
            });

            if (resp.ok) {
                // Rafraîchir la liste locale après succès backend
                await fetchMatches();
            } else {
                const data = await resp.json();
                alert(`Erreur API: ${data.detail || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error("Refresh error:", error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Reset pagination, search and league when sport changes
    useEffect(() => {
        setVisibleCount(6);
        setSearchTeamA("");
        setSearchTeamB("");
        setSelectedLeague(null);
    }, [currentSport]);

    const today = new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Extract unique leagues for the current sport
    const availableLeagues = Array.from(
        new Set(
            matches
                .filter(m => m.sport === currentSport || currentSport === "all")
                .map(m => m.league?.name)
                .filter(Boolean)
        )
    ).sort();

    // 1. Filter by Sport
    let filtered: Match[] = currentSport === "all"
        ? matches
        : matches.filter(m => m.sport === currentSport);

    // 2. Filter by League
    if (selectedLeague) {
        filtered = filtered.filter(m => m.league?.name === selectedLeague);
    }

    // 3. Filter by Status - Only LIVE and UPCOMING
    filtered = filtered.filter(m => m.status === "live" || m.status === "upcoming");

    // Sort: Live first, then by date/time
    filtered.sort((a, b) => {
        if (a.status === "live" && b.status !== "live") return -1;
        if (b.status === "live" && a.status !== "live") return 1;
        return new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime();
    });

    const isSearching = searchTeamA.trim() !== "" || searchTeamB.trim() !== "";

    // 4. Filter by Search (VS Logic + Short Name + Acronym)
    if (isSearching) {
        // Generate acronym from a team name: "Paris Saint Germain" → "psg"
        const acronym = (name: string) => name.split(/\s+/).map(w => w[0]).join("").toLowerCase();

        // Check if a search term matches a team (name, stored code, or acronym)
        const teamMatches = (searchTerm: string, teamName: string, teamShort: string) => {
            const name = teamName.toLowerCase();
            const short = teamShort.toLowerCase();
            const acr = acronym(teamName);
            return name.includes(searchTerm) || short.includes(searchTerm) || acr.includes(searchTerm);
        };

        filtered = filtered.filter(m => {
            const teamAInput = searchTeamA.trim().toLowerCase();
            const teamBInput = searchTeamB.trim().toLowerCase();

            const homeName = m.homeTeam?.name || "";
            const homeShort = m.homeTeam?.short || "";
            const awayName = m.awayTeam?.name || "";
            const awayShort = m.awayTeam?.short || "";

            // Single search field used
            if (teamAInput && !teamBInput) {
                return teamMatches(teamAInput, homeName, homeShort) || teamMatches(teamAInput, awayName, awayShort);
            }
            if (!teamAInput && teamBInput) {
                return teamMatches(teamBInput, homeName, homeShort) || teamMatches(teamBInput, awayName, awayShort);
            }

            // VS scenario: one term must match Home, the other Away
            if (teamAInput && teamBInput) {
                const aHome = teamMatches(teamAInput, homeName, homeShort);
                const aAway = teamMatches(teamAInput, awayName, awayShort);
                const bHome = teamMatches(teamBInput, homeName, homeShort);
                const bAway = teamMatches(teamBInput, awayName, awayShort);
                return (aHome && bAway) || (aAway && bHome);
            }
            return true;
        });
    }

    const visibleMatches = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in relative pb-8 sm:pb-12">
            {/* Aurora Background for Header area */}
            <div className="absolute top-[-100px] left-[-100px] right-[-100px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none opacity-50 mix-blend-screen" />

            {/* Header & Controls */}
            <div className="flex flex-col gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white capitalize">
                                {currentSport === "all" ? "Dashboard" : currentSport}
                            </h1>
                            {currentSport !== "all" && (
                                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter animate-pulse">
                                    Live & Imminent
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                            <Calendar className="size-3.5 text-primary" />
                            <span className="capitalize">{today}</span>
                            <span className="text-white/10">&middot;</span>
                            <span className="text-emerald-400 font-medium">
                                {loading ? "Chargement..." : `${filtered.length} matchs`}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "size-6 ml-1 text-muted-foreground hover:text-primary transition-colors",
                                    isRefreshing && "animate-spin text-primary"
                                )}
                                onClick={handleRefresh}
                                disabled={isRefreshing || loading}
                                title="Rafraîchir les scores"
                            >
                                <RefreshCw className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10 backdrop-blur-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "h-8 px-3 gap-2 text-xs transition-all",
                                viewMode === "grid" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                            )}
                        >
                            <LayoutGrid className="size-3.5" /> Grille
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "h-8 px-3 gap-2 text-xs transition-all",
                                viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                            )}
                        >
                            <List className="size-3.5" /> Liste
                        </Button>
                    </div>
                </div>

                {/* League Filter - Discreet Badges */}
                {currentSport !== "all" && availableLeagues.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none animate-in fade-in slide-in-from-left-4 duration-500">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLeague(null)}
                            className={cn(
                                "h-7 px-3 text-[11px] rounded-full border transition-all whitespace-nowrap",
                                !selectedLeague
                                    ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)]"
                                    : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            Toutes les ligues
                        </Button>
                        {availableLeagues.map((league) => (
                            <Button
                                key={league}
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLeague(league)}
                                className={cn(
                                    "h-7 px-3 text-[11px] rounded-full border transition-all whitespace-nowrap",
                                    selectedLeague === league
                                        ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)]"
                                        : "bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {league}
                            </Button>
                        ))}
                    </div>
                )}

                {/* VS Search Bar - Only for specific sports */}
                {currentSport !== "all" && (
                    <div className="w-full max-w-4xl mx-auto bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 backdrop-blur-md shadow-2xl shadow-blue-900/10 animate-in fade-in slide-in-from-top-4 duration-700 ease-out hover:border-white/20 transition-all group">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Équipe / Joueur 1"
                                className="pl-12 h-12 text-base bg-black/40 border-white/10 focus-visible:ring-primary/50 transition-all"
                                value={searchTeamA}
                                onChange={(e) => setSearchTeamA(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-center size-10 rounded-full bg-linear-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/20 z-10 scale-100 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-xs font-black text-white italic">VS</span>
                        </div>

                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Équipe / Joueur 2"
                                className="pl-12 h-12 text-base bg-black/40 border-white/10 focus-visible:ring-primary/50 transition-all"
                                value={searchTeamB}
                                onChange={(e) => setSearchTeamB(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="relative z-10 mt-6 space-y-8">
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[260px] w-full bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <>
                        {viewMode === "grid" ? (
                            <MatchGrid matches={visibleMatches} />
                        ) : (
                            <MatchTable items={visibleMatches} />
                        )}

                        {hasMore && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto min-w-[200px] gap-2 h-12"
                                    onClick={() => setVisibleCount(prev => prev + 6)}
                                >
                                    Voir plus de matchs ({filtered.length - visibleCount}) <ChevronDown className="size-4" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <Swords className="size-10 mb-4 opacity-20" />
                        <p className="font-medium text-lg">Aucun match trouvé</p>
                        <p className="text-sm opacity-60">Essayez de modifier vos critères de recherche.</p>
                        {(searchTeamA || searchTeamB) && (
                            <Button
                                variant="link"
                                onClick={() => { setSearchTeamA(""); setSearchTeamB(""); }}
                                className="mt-2 text-primary"
                            >
                                Effacer la recherche
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function MatchGrid({ matches: items }: { matches: Match[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 stagger-children">
            {items.map((match) => (
                <div key={match.id} className="h-[260px]">
                    <MatchCard match={match} />
                </div>
            ))}
        </div>
    );
}
