import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BetixLogo } from "@/components/ui/betix-logo";
import { Menu, X } from "lucide-react";
import { FootballIcon, BasketballIcon, TennisIcon } from "@/components/icons/SportIcons";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* ===== NAVBAR PUBLIC ===== */}
            <header className="sticky top-0 z-50 w-full glassmorphism">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <BetixLogo className="h-8" />
                    </Link>

                    {/* Nav Links — hidden on mobile */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link
                            href="/#features"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Fonctionnalit&eacute;s
                        </Link>
                        <Link
                            href="/#sports"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sports
                        </Link>
                        <Link
                            href="/#pricing"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Tarifs
                        </Link>
                    </nav>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                                Se connecter
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button size="sm" className="gradient-accent text-white border-0">
                                Débuter
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1">{children}</main>

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-border/50 bg-card/30">
                <div className="container mx-auto px-4 md:px-6 py-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-1.5">
                                <BetixLogo className="h-7 w-auto" />
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Pronostics IA pour parieurs exigeants. Analyses sportives aliment&eacute;es par l&apos;intelligence artificielle.
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                <FootballIcon size={16} className="text-muted-foreground" />
                                <BasketballIcon size={16} className="text-muted-foreground" />
                                <TennisIcon size={16} className="text-muted-foreground" />
                            </div>
                        </div>

                        {/* Produit */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Produit</h4>
                            <ul className="space-y-2">
                                <li><Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalit&eacute;s</Link></li>
                                <li><Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</Link></li>
                                <li><Link href="/#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                            </ul>
                        </div>

                        {/* L&eacute;gal */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">L&eacute;gal</h4>
                            <ul className="space-y-2">
                                <li><Link href="/cgu" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CGU</Link></li>
                                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Confidentialit&eacute;</Link></li>
                                <li><Link href="/mentions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions l&eacute;gales</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Contact</h4>
                            <ul className="space-y-2">
                                <li><a href="mailto:support@betix.io" className="text-sm text-muted-foreground hover:text-foreground transition-colors">support@betix.io</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-xs text-muted-foreground">
                            &copy; 2026 BETIX. Tous droits r&eacute;serv&eacute;s.
                        </p>
                        <p className="text-xs text-muted-foreground text-center">
                            Jeu responsable. Les pronostics ne garantissent aucun gain.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
