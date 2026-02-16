"use client";

import { BetixLogo } from "@/components/ui/betix-logo";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ShieldCheck, Lock, Fingerprint } from "lucide-react";

interface AccessTerminalProps {
    children: React.ReactNode;
    type: "login" | "signup" | "reset" | "onboarding";
}

export function AccessTerminal({ children, type }: AccessTerminalProps) {
    const isWide = type === "onboarding";

    const getTitle = () => {
        switch (type) {
            case "login": return "Identity Verification";
            case "signup": return "New Agent Registration";
            case "reset": return "Credential Recovery";
            case "onboarding": return "Agent Profiling";
        }
    };

    const getDescription = () => {
        switch (type) {
            case "login": return "Enter your credentials to access the prediction engine.";
            case "signup": return "Create your clearance profile to join the network.";
            case "reset": return "Initiate protocol to restore access.";
            case "onboarding": return "Calibrate your feed for optimal intelligence.";
        }
    };

    return (
        <div className="min-h-screen bg-black relative flex items-center justify-center overflow-hidden p-4 md:p-0">

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-pulse-slow" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">

                {/* Left Panel: Form (The Terminal) */}
                <div className="bg-black/60 backdrop-blur-xl p-8 md:p-12 flex flex-col justify-center relative border-r border-white/5">
                    {/* Header */}
                    <div className="mb-8 md:mb-12">
                        <Link href="/" className="flex items-center gap-2 mb-6 group w-fit">
                            <BetixLogo className="h-8 w-auto" />
                        </Link>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-[10px] uppercase tracking-widest px-2 py-0.5">
                                    <Lock className="size-3 mr-1" /> Secure Access
                                </Badge>
                                <span className="text-[10px] text-neutral-500 font-mono">v2.5.0-RC1</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                                {getTitle()}
                            </h1>
                            <p className="text-neutral-400 text-sm">
                                {getDescription()}
                            </p>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className={cn("w-full mx-auto md:mx-0", isWide ? "max-w-md" : "max-w-sm")}>
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 md:mt-12 text-center md:text-left">
                        <p className="text-xs text-neutral-600 font-mono flex items-center gap-2 justify-center md:justify-start">
                            <ShieldCheck className="size-3" />
                            ENCRYPTED CONNECTION (AES-256)
                        </p>
                    </div>
                </div>

                {/* Right Panel: Teaser (The Hologram) */}
                <div className="hidden md:flex flex-col relative overflow-hidden bg-neutral-900/50 items-center justify-center p-12">

                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />

                    {/* Floating Ticket Hologram */}
                    <div className="relative z-10 perspective-1000">
                        <div className="w-64 h-80 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md p-6 transform rotate-y-12 rotate-x-6 animate-float shadow-2xl relative">
                            {/* Scanning Line */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-[20%] w-full animate-scan" />

                            <div className="space-y-4 opacity-50 grayscale blur-[1px]">
                                <div className="h-4 w-24 bg-white/10 rounded" />
                                <div className="h-8 w-full bg-white/5 rounded" />
                                <div className="h-20 w-full bg-blue-500/10 rounded border border-blue-500/30" />
                                <div className="h-4 w-1/2 bg-white/10 rounded" />
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl flex flex-col items-center gap-2 shadow-2xl">
                                    <Fingerprint className="size-8 text-blue-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white uppercase tracking-widest text-center">
                                        RESTRICTED<br />ACCESS
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center relative z-10 max-w-xs">
                        <h3 className="text-lg font-bold text-white mb-2">Join the Elite</h3>
                        <p className="text-sm text-neutral-400">
                            Access real-time predictions, value bets, and exclusive insights reserved for cleared personnel.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}
