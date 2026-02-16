"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScanFace, ChevronRight, Lock, Loader2 } from "lucide-react";

interface SecurityScannerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    label?: string;
}

export function SecurityScanner({ className, isLoading, label = "INITIATE SEQUENCE", ...props }: SecurityScannerProps) {
    return (
        <div className="relative group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />

            <Button
                className={cn(
                    "relative w-full h-14 bg-black border border-white/10 hover:bg-neutral-900 text-white overflow-hidden transition-all duration-300",
                    "group-hover:border-blue-500/50",
                    className
                )}
                disabled={isLoading}
                {...props}
            >
                {/* Scanner Light Effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent -translate-x-full group-hover:animate-shimmer" />

                <div className="relative flex items-center justify-between w-full px-2">
                    {/* Left Icon */}
                    <div className={cn(
                        "size-10 rounded bg-white/5 flex items-center justify-center border border-white/5 transition-colors",
                        "group-hover:bg-blue-500/20 group-hover:border-blue-500/30 group-hover:text-blue-400"
                    )}>
                        {isLoading ? <Loader2 className="size-5 animate-spin" /> : <ScanFace className="size-5" />}
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-bold tracking-widest uppercase">
                            {isLoading ? "VERIFYING CREDENTIALS..." : label}
                        </span>
                        {!isLoading && (
                            <span className="text-[9px] text-neutral-500 font-mono group-hover:text-blue-400 transition-colors">
                                BIOMETRIC CLEARANCE REQUIRED
                            </span>
                        )}
                    </div>

                    {/* Right Icon */}
                    <div className="size-10 flex items-center justify-center text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                        {isLoading ? <Lock className="size-5 animate-pulse" /> : <ChevronRight className="size-5" />}
                    </div>
                </div>

                {/* Progress Bar (Loading) */}
                {isLoading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-full animate-progress-indeterminate" />
                )}
            </Button>
        </div>
    );
}
