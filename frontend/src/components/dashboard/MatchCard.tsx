"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot } from "lucide-react";
import { SportIcon } from "@/components/icons/SportIcons";
import { Match } from "@/types/match";

interface MatchCardProps {
    match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
    const league = match.league;
    const isLive = match.status === "live";
    const isFinished = match.status === "finished";
    const topPrediction = match.predictions?.[0];

    // Sport-based neon accents (left border + glow)
    const sportDetails = match.sport === "football"
        ? { border: "border-l-emerald-500", glow: "shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)]", text: "text-emerald-500" }
        : match.sport === "basketball"
            ? { border: "border-l-orange-500", glow: "shadow-[0_0_20px_-10px_rgba(249,115,22,0.3)]", text: "text-orange-500" }
            : { border: "border-l-yellow-500", glow: "shadow-[0_0_20px_-10px_rgba(234,179,8,0.3)]", text: "text-yellow-500" };

    return (
        <Link href={`/dashboard/match/${match.id}`}>
            <Card className={`
                relative overflow-hidden
                bg-black/40 backdrop-blur-xl border-white/10
                border-l-[3px] ${sportDetails.border}
                hover:border-white/20 hover:scale-[1.02] hover:${sportDetails.glow}
                transition-all duration-300 group cursor-pointer h-full
            `}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                <CardContent className="p-5 relative z-10 space-y-5">
                    {/* Header: League & Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <SportIcon sport={match.sport} size={14} className={sportDetails.text} />
                            <span>{league?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
                                {isLive ? (
                                    <Badge className="bg-red-500/90 hover:bg-red-500 text-white border-0 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold shadow-lg shadow-red-500/20 backdrop-blur-md animate-pulse">
                                        LIVE
                                    </Badge>
                                ) : match.status === "imminent" ? (
                                    <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold shadow-lg shadow-amber-500/20 backdrop-blur-md animate-pulse">
                                        IMMINENT
                                    </Badge>
                                ) : isFinished ? (
                                    <Badge variant="outline" className="bg-neutral-900/60 border-white/10 text-neutral-400 px-2 py-0.5 text-[10px] sm:text-[11px] backdrop-blur-md">
                                        TERMINÉ
                                    </Badge>
                                ) : ( // This covers "upcoming"
                                    <Badge className="bg-blue-600/90 hover:bg-blue-600 text-white border-0 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold shadow-lg shadow-blue-500/20 backdrop-blur-md">
                                        PROCHAINEMENT
                                    </Badge>
                                )}
                            </div>
                            {topPrediction && (
                                <Badge className={`
                                    text-[10px] px-2 py-0.5 h-5 border
                                    ${topPrediction.level === "safe"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-4px_rgba(16,185,129,0.5)]"
                                        : topPrediction.level === "value"
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_-4px_rgba(168,85,247,0.5)]"
                                            : "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_-4px_rgba(249,115,22,0.5)]"
                                    }
                                `}>
                                    {topPrediction.level.toUpperCase()} {topPrediction.confidence}%
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Match Content */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                        {/* Home */}
                        <div className="flex-1 flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="size-12 sm:size-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {match.homeTeam.logo ? (
                                    <img
                                        src={match.homeTeam.logo}
                                        alt={match.homeTeam.name}
                                        className="size-full object-contain p-2 sm:p-2.5"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] sm:text-xs font-bold text-muted-foreground">${match.homeTeam.short}</span>`;
                                        }}
                                    />
                                ) : (
                                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{match.homeTeam.short}</span>
                                )}
                            </div>
                            <span className="text-xs sm:text-sm font-semibold truncate text-white">{match.homeTeam.name}</span>
                        </div>

                        {/* Score / Time */}
                        <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px]">
                            {isLive || isFinished ? (
                                <div className="text-lg sm:text-xl font-bold font-mono tracking-tighter text-white whitespace-nowrap">
                                    {match.homeScore} - {match.awayScore}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <div className="text-base sm:text-lg font-bold font-mono text-white">{match.time}</div>
                                    <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-tighter">
                                        {(() => {
                                            const now = new Date();
                                            const matchDateStr = match.date;
                                            const todayStr = now.toISOString().split('T')[0];

                                            const tomorrowDate = new Date(now);
                                            tomorrowDate.setDate(now.getDate() + 1);
                                            const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

                                            if (matchDateStr === todayStr) return "Aujourd'hui";
                                            if (matchDateStr === tomorrowStr) return "Demain";
                                            return new Date(matchDateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Away */}
                        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold truncate text-white text-right">{match.awayTeam.name}</span>
                            <div className="size-12 sm:size-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {match.awayTeam.logo ? (
                                    <img
                                        src={match.awayTeam.logo}
                                        alt={match.awayTeam.name}
                                        className="size-full object-contain p-2 sm:p-2.5"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-[10px] sm:text-xs font-bold text-muted-foreground">${match.awayTeam.short}</span>`;
                                        }}
                                    />
                                ) : (
                                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">{match.awayTeam.short}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer: AI Analysis Call to Action */}
                    {topPrediction && (
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-white transition-colors">
                                <Bot className="size-3.5 text-primary shrink-0" />
                                <span>Analyse par Betix AI</span>
                            </div>
                            <ArrowRight className="size-3.5 text-primary -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
