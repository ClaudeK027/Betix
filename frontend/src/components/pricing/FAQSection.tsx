"use client";

import { cn } from "@/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function FAQSection() {
    const faqs = [
        {
            q: "Pourquoi seulement 1€/mois ?",
            a: "Nous croyons que l'accès à des analyses de qualité ne devrait pas coûter une fortune. Notre modèle économique repose sur le volume d'abonnés, pas sur des prix exorbitants. C'est un 'No-Brainer'."
        },
        {
            q: "Puis-je changer de plan quand je veux ?",
            a: "Oui, absolument. Vous pouvez passer du mensuel à l'annuel ou revenir au gratuit à tout moment depuis votre dashboard. Aucun frais caché, aucune pénalité."
        },
        {
            q: "Quels moyens de paiement acceptez-vous ?",
            a: "Nous acceptons toutes les cartes bancaires majeures (Visa, Mastercard, Amex) via Stripe, la plateforme de paiement la plus sécurisée au monde. Vos données sont chiffrées et protégées."
        },
        {
            q: "Y a-t-il une garantie de résultats ?",
            a: "Dans le pari sportif, rien n'est garanti à 100%. Cependant, nous garantissons la transparence de nos résultats et la qualité de nos analyses. Si vous n'êtes pas satisfait, nous vous remboursons sous 30 jours."
        },
        {
            q: "Comment fonctionne l'IA de prédiction ?",
            a: "Notre moteur IA analyse des milliers de points de données (forme, blessures, météo, historique) pour générer des probabilités précises. Nous combinons ces données avec l'expertise humaine pour valider chaque pronostic."
        }
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-8 flex items-center justify-center gap-3">
                <HelpCircle className="size-6 text-neutral-500" />
                Questions Fréquentes
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((item, i) => (
                    <AccordionItem
                        key={i}
                        value={`q${i}`}
                        className="group border border-white/5 bg-black/40 rounded-xl px-2 overflow-hidden hover:border-white/10 transition-colors data-[state=open]:border-blue-500/30 data-[state=open]:bg-blue-500/[0.02]"
                    >
                        <AccordionTrigger className="text-base font-bold text-neutral-300 hover:text-white hover:no-underline py-5 px-4">
                            {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-neutral-400 pb-5 px-4 leading-relaxed">
                            {item.a}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
