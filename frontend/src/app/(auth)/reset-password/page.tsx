"use client";

import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const { resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await resetPasswordForEmail(email);

        if (error) {
            toast.error("Échec de l'envoi", {
                description: error,
            });
            setIsLoading(false);
            return;
        }

        setEmailSent(true);
        setIsLoading(false);
    };

    return (
        <AccessTerminal type="reset">
            {emailSent ? (
                <div className="text-center space-y-4 py-4">
                    <div className="flex justify-center">
                        <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="size-8 text-emerald-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">E-mail envoyé !</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Si un compte existe avec l&apos;adresse <span className="text-white font-medium">{email}</span>,
                            vous recevrez un lien pour réinitialiser votre mot de passe.
                        </p>
                    </div>
                    <p className="text-xs text-neutral-500 mt-4">Vérifiez aussi vos spams.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <BiometricInput
                        label="Adresse e-mail"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <SecurityScanner type="submit" isLoading={isLoading} label="Envoyer le lien" />
                </form>
            )}

            <div className="text-center mt-8">
                <Link href="/login" className="text-sm text-neutral-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                    <ArrowLeft className="size-4" />
                    Retour à la connexion
                </Link>
            </div>
        </AccessTerminal>
    );
}
