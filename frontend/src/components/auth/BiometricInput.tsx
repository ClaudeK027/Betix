"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BiometricInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    error?: string;
}

export const BiometricInput = React.forwardRef<HTMLInputElement, BiometricInputProps>(
    ({ className, label, icon: Icon, error, ...props }, ref) => {
        return (
            <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                    <Label className={cn(
                        "text-sm font-medium transition-colors",
                        error ? "text-red-500" : "text-neutral-300 group-focus-within:text-white"
                    )}>
                        {label}
                    </Label>
                </div>

                <div className="relative">
                    {Icon && (
                        <div className={cn(
                            "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors z-10",
                            error ? "text-red-500" : "text-neutral-500 group-focus-within:text-blue-400"
                        )}>
                            <Icon className="size-4.5" />
                        </div>
                    )}

                    <Input
                        ref={ref}
                        className={cn(
                            "pl-11 bg-white/5 border-white/10 text-white h-12 rounded-xl transition-all duration-300 text-base placeholder:text-neutral-500",
                            error ? "border-red-500/50 focus-visible:border-red-500 focus-visible:ring-red-500/20" :
                                "focus-visible:border-blue-500/50 focus-visible:ring-blue-500/20 hover:border-white/20 hover:bg-white/10",
                            className
                        )}
                        {...props}
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-400 font-medium ml-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
BiometricInput.displayName = "BiometricInput";
