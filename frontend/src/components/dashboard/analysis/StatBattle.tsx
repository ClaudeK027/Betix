"use client";

import { cn } from "@/lib/utils";

interface StatBattleProps {
    label: string;
    homeValue: number;
    awayValue: number;
    showPercent?: boolean;
}

export function StatBattle({ label, homeValue, awayValue, showPercent = false }: StatBattleProps) {
    const total = homeValue + awayValue;
    const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
    const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

    return (
        <div className="space-y-3 py-3 group">
            <div className="flex justify-between items-end text-sm font-medium">
                <span className={cn(
                    "text-[16px] transition-all duration-300 tracking-tight",
                    homeValue > awayValue ? "text-white font-black drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-110 origin-left" : "text-white/20 font-medium"
                )}>
                    {homeValue} {showPercent && "%"}
                </span>
                <span className="uppercase text-[9px] tracking-[0.3em] font-black text-white/20 group-hover:text-primary/60 transition-colors duration-300 mb-0.5">{label}</span>
                <span className={cn(
                    "text-[16px] transition-all duration-300 tracking-tight",
                    awayValue > homeValue ? "text-white font-black drop-shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-110 origin-right" : "text-white/20 font-medium"
                )}>
                    {awayValue} {showPercent && "%"}
                </span>
            </div>

            <div className="flex h-1.5 bg-white/[0.03] rounded-sm overflow-hidden relative shadow-inner ring-1 ring-white/5">
                {/* Home Bar (Electric Cyan/Indigo) */}
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-out flex items-center justify-end relative rounded-sm",
                        homeValue > awayValue ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] z-10" : "bg-white/5"
                    )}
                    style={{ width: `${homePercent}%` }}
                >
                    {homeValue > awayValue && (
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    )}
                </div>

                {/* Gap */}
                <div className="w-[4px] bg-transparent z-20 shrink-0" />

                {/* Away Bar (Neon Rose/Magenta) */}
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-out flex items-center justify-start relative rounded-sm",
                        awayValue > homeValue ? "bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] z-10" : "bg-white/5"
                    )}
                    style={{ width: `${awayPercent}%` }}
                >
                    {awayValue > homeValue && (
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    )}
                </div>
            </div>
        </div>
    );
}
