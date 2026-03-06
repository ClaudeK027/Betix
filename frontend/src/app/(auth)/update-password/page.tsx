"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const { updatePassword } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas", {
                description: "Veuillez vérifier votre saisie.",
            });
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Mot de passe trop court", {
                description: "Le mot de passe doit contenir au moins 6 caractères.",
            });
            return;
        }

        setIsLoading(true);

        const { error } = await updatePassword(formData.password);

        if (error) {
            toast.error("Échec de la mise à jour", {
                description: error,
            });
            setIsLoading(false);
            return;
        }

        toast.success("Mot de passe mis à jour", {
            description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        });

        router.push("/login");
    };

    const passwordsMatch = formData.confirmPassword.length === 0 || formData.password === formData.confirmPassword;

    return (
        <AccessTerminal type="reset">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <BiometricInput
                        label="Nouveau mot de passe"
                        type="password"
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    {/* Strength Meter */}
                    <div className="flex gap-1 mt-1 px-1">
                        <div className={`h-1 flex-1 rounded-full transition-colors ${formData.password.length >= 4 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${formData.password.length >= 8 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${formData.password.length >= 10 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${formData.password.length >= 12 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                    </div>
                </div>

                <BiometricInput
                    label="Confirmer le mot de passe"
                    type="password"
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    error={!passwordsMatch ? "Les mots de passe ne correspondent pas" : undefined}
                    required
                />

                <div className="pt-2">
                    <SecurityScanner type="submit" isLoading={isLoading} label="Mettre à jour le mot de passe" />
                </div>
            </form>
        </AccessTerminal>
    );
}
