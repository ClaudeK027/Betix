"use client";

import { NeuralUplinks } from "@/components/admin/settings/NeuralUplinks";
import { CortexConfig } from "@/components/admin/settings/CortexConfig";
import { SystemBreakers } from "@/components/admin/settings/SystemBreakers";
import { AlgorithmicControl } from "@/components/admin/settings/AlgorithmicControl";
import { Button } from "@/components/ui/button";
import { Terminal, Save } from "lucide-react";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-12 animate-fade-in pb-12 max-w-7xl mx-auto">

            {/* Command Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2">The Core</h1>
                    <p className="text-sm font-mono text-neutral-500 flex items-center gap-2">
                        <Terminal className="size-3.5" /> SYSTEM_ROOT_ACCESS_GRANTED
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-mono text-xs">
                        VIEW_LOGS
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]">
                        <Save className="size-4 mr-2" /> COMMIT_CHANGES
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* 1. Algorithmic Control (Left) */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        Algorithmic Control
                    </h2>
                    <AlgorithmicControl />
                </section>

                {/* 2. Neural Uplinks (Right) */}
                <section className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Neural Uplinks
                    </h2>
                    <div className="opacity-90 hover:opacity-100 transition-opacity">
                        <NeuralUplinks />
                    </div>
                </section>
            </div>

            {/* 3. Cortex Configuration (IA) */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Cortex Overclocking
                </h2>
                <CortexConfig />
            </section>

            {/* 4. System Breakers (App Settings) */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600 px-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    System Breakers
                </h2>
                <SystemBreakers />
            </section>

        </div>
    );
}
