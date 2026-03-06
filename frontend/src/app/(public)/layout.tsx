import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BetixLogo } from "@/components/ui/betix-logo";
import { Menu, X, LayoutDashboard, Trophy, CreditCard, LogIn, ArrowRight } from "lucide-react";
import { FootballIcon, BasketballIcon, TennisIcon } from "@/components/icons/SportIcons";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";

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

                    {/* CTA Buttons & Mobile Menu */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors sm:block">
                            Se connecter
                        </Link>
                        <Link href="/signup">
                            <Button size="sm" className="gradient-accent text-white border-0 h-9 px-4 sm:px-5">
                                Débuter
                            </Button>
                        </Link>

                        {/* Mobile Menu */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="ml-1 text-muted-foreground hover:text-foreground">
                                        <Menu className="size-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[85vw] max-w-[400px] border-l border-white/10 bg-black/95 backdrop-blur-xl p-0">
                                    <SheetHeader className="p-6 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <SheetTitle className="flex items-center">
                                                <BetixLogo className="h-8 w-auto" />
                                                <span className="sr-only">Menu principal</span>
                                            </SheetTitle>
                                        </div>
                                    </SheetHeader>

                                    <div className="flex flex-col gap-2 p-6 mt-2">
                                        <SheetClose asChild>
                                            <Link href="/#features" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all">
                                                <LayoutDashboard className="size-5 text-primary" />
                                                Fonctionnalités
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/#sports" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all">
                                                <Trophy className="size-5 text-emerald-400" />
                                                Sports
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/#pricing" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all">
                                                <CreditCard className="size-5 text-purple-400" />
                                                Tarifs
                                            </Link>
                                        </SheetClose>

                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-4" />

                                        <SheetClose asChild>
                                            <Link href="/login" className="flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-all">
                                                <LogIn className="size-5" />
                                                Se connecter
                                            </Link>
                                        </SheetClose>

                                        <SheetClose asChild>
                                            <Link href="/signup" className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:scale-[1.02] border-0">
                                                Débuter
                                                <ArrowRight className="size-5 text-white/80" />
                                            </Link>
                                        </SheetClose>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
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
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold">Contact</h4>
                            <ul className="space-y-2">
                                <li><a href="mailto:bet-ix@outlook.fr" className="text-sm text-muted-foreground hover:text-foreground transition-colors">bet-ix@outlook.fr</a></li>
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
