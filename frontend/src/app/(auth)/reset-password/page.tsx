"use client";

import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate auth delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsLoading(false);
    };

    return (
        <AccessTerminal type="reset">
            <form onSubmit={handleSubmit} className="space-y-6">
                <BiometricInput
                    label="Recovery Email"
                    type="email"
                    icon={Mail}
                    placeholder="agent@betix.gg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <SecurityScanner type="submit" isLoading={isLoading} label="INITIATE RECOVERY" />
            </form>

            <div className="text-center mt-8">
                <Link href="/login" className="text-xs text-neutral-500 hover:text-white flex items-center justify-center gap-2 font-mono uppercase tracking-wide group transition-colors">
                    <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
                    Return to Login Terminal
                </Link>
            </div>
        </AccessTerminal>
    );
}
