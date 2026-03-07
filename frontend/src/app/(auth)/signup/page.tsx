"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });
    const { signUp, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation côté client
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

        const { error, needsConfirmation } = await signUp(formData.email, formData.password);

        if (error) {
            toast.error("Échec de l'inscription", {
                description: error,
            });
            setIsLoading(false);
            return;
        }

        if (needsConfirmation) {
            toast.success("Vérifiez votre boîte e-mail", {
                description: "Un lien de confirmation vous a été envoyé pour activer votre accès.",
                duration: 10000,
            });
            setIsLoading(false);
            return;
        }

        toast.success("Accès créé avec succès", {
            description: "Bienvenue chez BETIX !",
        });

        router.push("/dashboard");
    };

    const passwordsMatch = formData.confirmPassword.length === 0 || formData.password === formData.confirmPassword;

    return (
        <AccessTerminal type="signup">
            {/* OAuth */}
            <div className="space-y-3 mb-5 sm:mb-8">
                <Button
                    variant="outline"
                    disabled={isLoading}
                    className="w-full h-10 sm:h-11 bg-white hover:bg-neutral-100 text-black border-0 rounded-xl transition-all duration-300 gap-3 font-medium text-sm"
                    onClick={async () => {
                        setIsLoading(true);
                        toast.info("Initialisation de l'accès Google...");
                        const { error } = await signInWithGoogle();
                        if (error) {
                            toast.error("Échec Google Registration", { description: error });
                            setIsLoading(false);
                        }
                    }}
                >
                    <svg className="size-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuer avec Google
                </Button>
            </div>

            <div className="relative mb-5 sm:mb-8">
                <Separator className="bg-white/10" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950 px-4 text-xs font-medium text-neutral-500">
                    ou
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                <BiometricInput
                    label="Adresse e-mail"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />

                <div className="space-y-2">
                    <BiometricInput
                        label="Mot de passe"
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

                <div className="flex items-start gap-3 mt-4">
                    <Checkbox id="terms" className="mt-0.5 border-white/20 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black" />
                    <Label htmlFor="terms" className="text-xs text-neutral-400 font-medium leading-relaxed">
                        J&apos;accepte les <Link href="/cgu" className="text-white hover:underline transition-colors">Conditions d&apos;Utilisation</Link> et la <Link href="/privacy" className="text-white hover:underline transition-colors">Politique de Confidentialité</Link>.
                    </Label>
                </div>

                <div className="pt-2">
                    <SecurityScanner type="submit" isLoading={isLoading} label="Créer mon compte" />
                </div>

            </form>

            <div className="text-center mt-5 sm:mt-8">
                <p className="text-sm text-neutral-500">
                    Déjà inscrit ?{" "}
                    <Link href="/login" className="text-white hover:underline transition-colors ml-1 font-medium">
                        Se connecter
                    </Link>
                </p>
            </div>
        </AccessTerminal>
    );
}
