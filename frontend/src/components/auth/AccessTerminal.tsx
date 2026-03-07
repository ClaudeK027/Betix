"use client";

import { BetixLogo } from "@/components/ui/betix-logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";

interface AccessTerminalProps {
    children: React.ReactNode;
    type: "login" | "signup" | "reset" | "onboarding";
}

export function AccessTerminal({ children, type }: AccessTerminalProps) {
    const isWide = type === "onboarding";

    const getTitle = () => {
        switch (type) {
            case "login": return "Connexion";
            case "signup": return "Créer un compte";
            case "reset": return "Mot de passe oublié";
            case "onboarding": return "Configuration";
        }
    };

    const getDescription = () => {
        switch (type) {
            case "login": return "Bienvenue. Connectez-vous à votre espace.";
            case "signup": return "Rejoignez l'élite des parieurs sportifs.";
            case "reset": return "Saisissez votre e-mail pour réinitialiser votre accès.";
            case "onboarding": return "Personnalisez votre expérience.";
        }
    };

    return (
        <AuroraBackground className="min-h-[100dvh] relative flex items-center justify-center px-3 py-6 sm:p-6">
            <div className={cn(
                "w-full bg-neutral-950/80 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:p-12 relative z-10 shadow-2xl overflow-hidden my-auto",
                isWide ? "max-w-2xl" : "max-w-md"
            )}>
                {/* Subtle top glow */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

                <div className="flex flex-col items-center mb-5 sm:mb-8">
                    <Link href="/" className="mb-4 sm:mb-6 hover:opacity-80 transition-opacity">
                        <BetixLogo className="h-7 sm:h-8 w-auto" />
                    </Link>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight text-center">
                        {getTitle()}
                    </h1>
                    <p className="text-neutral-400 text-xs sm:text-sm mt-1.5 sm:mt-2 text-center">
                        {getDescription()}
                    </p>
                </div>

                <div className="w-full">
                    {children}
                </div>

                <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-white/5 text-center">
                    <p className="text-[10px] text-neutral-600 font-mono flex items-center justify-center gap-1.5 uppercase tracking-widest">
                        <ShieldCheck className="size-3" />
                        Connexion sécurisée
                    </p>
                </div>
            </div>
        </AuroraBackground>
    );
}
