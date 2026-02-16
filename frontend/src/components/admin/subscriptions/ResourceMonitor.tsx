"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, ArrowUpDown, BarChart3, Zap } from "lucide-react";

export function ResourceMonitor() {
    // Mock Data (could be passed as props later)
    const kpis = [
        { label: "FUEL RESERVES (MRR)", value: "2,890€", change: "+15.2%", icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500", trend: "up" },
        { label: "YIELD / UNIT (ARPU)", value: "8.44€", change: "+0.8€", icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500", trend: "up" },
        { label: "CONVERSION RATE", value: "27.4%", change: "+2.1%", icon: Zap, color: "text-blue-400", bg: "bg-blue-500", trend: "up" },
        { label: "CHURN RATE", value: "5.8%", change: "+1.6%", icon: ArrowUpDown, color: "text-red-400", bg: "bg-red-500", trend: "down" }, // Down trend is bad here but visualized as red
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-700">
            {kpis.map((kpi, index) => (
                <div key={index} className="relative group overflow-hidden rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">

                    {/* Background Progress Bar (Visual Flair) */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
                        <div className={cn("h-full w-[70%]", kpi.bg)} />
                    </div>

                    <div className="p-5 relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{kpi.label}</span>
                            <kpi.icon className={cn("size-4", kpi.color)} />
                        </div>

                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{kpi.value}</span>
                            <span className={cn("text-xs font-bold mb-1.5", kpi.color)}>
                                {kpi.change}
                            </span>
                        </div>
                    </div>

                    {/* Scanline Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_2px,rgba(0,0,0,0.2)_4px)] bg-[size:100%_4px] pointer-events-none opacity-20" />
                </div>
            ))}
        </div>
    );
}
