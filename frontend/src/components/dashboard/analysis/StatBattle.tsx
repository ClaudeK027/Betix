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
        <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm font-medium text-neutral-400">
                <span className={cn(homeValue > awayValue ? "text-white font-bold" : "")}>
                    {homeValue} {showPercent && "%"}
                </span>
                <span className="uppercase text-xs tracking-widest opacity-60">{label}</span>
                <span className={cn(awayValue > homeValue ? "text-white font-bold" : "")}>
                    {awayValue} {showPercent && "%"}
                </span>
            </div>

            <div className="flex h-2.5 bg-white/5 rounded-full overflow-hidden relative">
                {/* Home Bar */}
                <div
                    className="h-full bg-linear-to-r from-blue-600/50 to-blue-500 transition-all duration-1000 ease-out flex items-center justify-end pr-1 relative"
                    style={{ width: `${homePercent}%` }}
                >
                    {homeValue > awayValue && <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_10px_white]" />}
                </div>

                {/* Gap */}
                <div className="w-[2px] bg-black/80 z-10" />

                {/* Away Bar */}
                <div
                    className="h-full bg-linear-to-r from-red-500 to-red-600/50 transition-all duration-1000 ease-out flex items-center justify-start pl-1 relative"
                    style={{ width: `${awayPercent}%` }}
                >
                    {awayValue > homeValue && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/50 shadow-[0_0_10px_white]" />}
                </div>
            </div>
        </div>
    );
}
