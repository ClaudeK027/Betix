"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";

interface SecurityScannerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    label?: string;
}

export function SecurityScanner({ className, isLoading, label = "CONTINUER", ...props }: SecurityScannerProps) {
    return (
        <Button
            className={cn(
                "relative w-full h-14 bg-white text-black hover:bg-neutral-200 border-0 rounded-xl overflow-hidden shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] transition-all duration-300 hover:scale-[1.02] group",
                className
            )}
            disabled={isLoading}
            {...props}
        >
            <div className="relative flex items-center justify-center w-full px-2 gap-2">
                {isLoading && <Loader2 className="size-5 animate-spin text-black" />}

                <span className="text-base font-bold">
                    {isLoading ? "CHARGEMENT..." : label}
                </span>

                {!isLoading && (
                    <ChevronRight className="size-5 text-black group-hover:translate-x-1 transition-transform" />
                )}
            </div>
        </Button>
    );
}
