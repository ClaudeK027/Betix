"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccessTerminal } from "@/components/auth/AccessTerminal";
import { BiometricInput } from "@/components/auth/BiometricInput";
import { SecurityScanner } from "@/components/auth/SecurityScanner";
import { ShieldCheck, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function MFAPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const factor = factors?.all?.find(f => f.status === 'verified');

            if (!factor) {
                toast.error("Aucun facteur MFA trouvé");
                setIsLoading(false);
                return;
            }

            const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
            if (challenge.error) throw challenge.error;

            const verify = await supabase.auth.mfa.verify({
                factorId: factor.id,
                challengeId: challenge.data.id,
                code: code
            });

            if (verify.error) throw verify.error;

            toast.success("Sécurité validée", { description: "Accès au dashboard autorisé." });
            window.location.replace("/dashboard");
        } catch (err: any) {
            console.error("MFA Error:", err);
            setError(err.message || "Code invalide");
            toast.error("Échec de la validation", { description: err.message });
            setIsLoading(false);
        }
    };

    return (
        <AccessTerminal type="login">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <ShieldCheck className="size-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">MFA Required</h2>
                <p className="text-sm text-neutral-500 mt-2">
                    Enter the code from your authenticator app to authorize session.
                </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
                <BiometricInput
                    label="Verification Code"
                    type="text"
                    icon={MessageSquare}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                />

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center">
                            {error}
                        </p>
                    </div>
                )}

                <SecurityScanner
                    type="submit"
                    isLoading={isLoading}
                    label="VERIFY CLEARANCE"
                />
            </form>

            <div className="text-center mt-8">
                <button
                    onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
                    className="text-[10px] text-neutral-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
                >
                    Cancel Authentication
                </button>
            </div>
        </AccessTerminal>
    );
}
