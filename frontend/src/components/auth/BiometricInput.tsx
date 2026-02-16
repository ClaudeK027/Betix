"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, CheckCircle2, AlertCircle } from "lucide-react";

interface BiometricInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    error?: string;
}

export const BiometricInput = React.forwardRef<HTMLInputElement, BiometricInputProps>(
    ({ className, label, icon: Icon, error, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const [isValid, setIsValid] = React.useState(false);

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            if (e.target.value.length > 0 && !error) {
                setIsValid(true);
            } else {
                setIsValid(false);
            }
            props.onBlur?.(e);
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            props.onFocus?.(e);
        };

        return (
            <div className="space-y-1.5 group">
                <div className="flex items-center justify-between">
                    <Label className={cn(
                        "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                        error ? "text-red-500" : isFocused ? "text-blue-400" : "text-neutral-500"
                    )}>
                        {label}
                    </Label>
                    {isFocused && (
                        <span className="text-[9px] font-mono text-blue-500 animate-pulse flex items-center gap-1">
                            <Scan className="size-3" /> SCANNING_INPUT...
                        </span>
                    )}
                    {!isFocused && isValid && !error && (
                        <span className="text-[9px] font-mono text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> VERIFIED
                        </span>
                    )}
                    {error && (
                        <span className="text-[9px] font-mono text-red-500 flex items-center gap-1">
                            <AlertCircle className="size-3" /> INPUT_ERROR
                        </span>
                    )}
                </div>

                <div className="relative">
                    {Icon && (
                        <div className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10",
                            error ? "text-red-500" : isFocused ? "text-blue-500" : "text-neutral-500"
                        )}>
                            <Icon className="size-4" />
                        </div>
                    )}

                    <Input
                        ref={ref}
                        className={cn(
                            "pl-10 bg-black/50 border-white/5 text-white h-12 transition-all duration-300 font-mono text-sm",
                            error ? "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/20" :
                                "focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 hover:border-white/10",
                            className
                        )}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        {...props}
                    />

                    {/* Corner Makers */}
                    <div className={cn(
                        "absolute -top-px -left-px w-2 h-2 border-t border-l transition-colors duration-300 pointer-events-none",
                        isFocused ? "border-blue-500" : "border-transparent"
                    )} />
                    <div className={cn(
                        "absolute -bottom-px -right-px w-2 h-2 border-b border-r transition-colors duration-300 pointer-events-none",
                        isFocused ? "border-blue-500" : "border-transparent"
                    )} />

                    {/* Scanning Line (Active) */}
                    {isFocused && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md">
                            <div className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-scan-fast" />
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-[10px] text-red-400 font-mono mt-1 ml-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
BiometricInput.displayName = "BiometricInput";
