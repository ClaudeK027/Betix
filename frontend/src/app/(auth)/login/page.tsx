"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Mail, Lock, KeyRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Suspense } from "react";

function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { signIn, user, signOut } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("LoginForm: Attempting login for", formData.email);

        const { error } = await signIn(formData.email, formData.password);

        if (error) {
            console.error("LoginForm: Access denied", error);
            toast.error("Échec de l'authentification", {
                description: error,
            });
            setIsLoading(false);
            return;
        }

        console.log("LoginForm: Authentication successful, redirecting to", redirectTo);
        toast.success("Accès autorisé", {
            description: "Redirection vers le tableau de bord...",
        });

        // Utilisation de location.replace pour s'assurer que le cache du routeur Next.js
        // est complètement ignoré et que la nouvelle session est chargée proprement.
        window.location.replace(redirectTo);
    };

    // Redirect if already logged in
    useEffect(() => {
        if (user && !isLoading) {
            console.log("LoginPage: User already logged in, redirecting to", redirectTo);
            window.location.replace(redirectTo);
        }
    }, [user, isLoading, redirectTo]);

    if (user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <AccessTerminal type="login">
            {/* OAuth */}
            <div className="space-y-3 mb-8">
                <Button variant="outline" className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white gap-3 transition-all duration-300 group">
                    <svg className="size-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-bold tracking-wide">ACCESS WITH GOOGLE</span>
                </Button>
            </div>

            <div className="relative mb-8">
                <Separator className="bg-white/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black px-3 text-[10px] uppercase font-bold text-neutral-600 tracking-widest">
                    OR USE ENCRYPTED ID
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <BiometricInput
                    label="Agent Identifier (Email)"
                    type="email"
                    icon={Mail}
                    placeholder="agent@betix.gg"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />

                <div className="space-y-1.5">
                    <BiometricInput
                        label="Security Key (Password)"
                        type="password"
                        icon={Lock}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <div className="flex justify-end">
                        <Link
                            href="/reset-password"
                            className="text-[10px] text-neutral-500 hover:text-blue-400 transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
                        >
                            <KeyRound className="size-3" /> Reset Protocol ?
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                    <Label htmlFor="remember" className="text-xs text-neutral-400 font-medium">
                        Maintain secure session (30 days)
                    </Label>
                </div>

                <SecurityScanner type="submit" isLoading={isLoading} label="AUTHENTICATE ACCESS" />

            </form>

            <div className="text-center mt-8">
                <p className="text-xs text-neutral-500">
                    No clearance yet?{" "}
                    <Link href="/signup" className="text-white hover:text-blue-400 font-bold uppercase tracking-wide transition-colors ml-1">
                        Request Access
                    </Link>
                </p>
            </div>
        </AccessTerminal>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
