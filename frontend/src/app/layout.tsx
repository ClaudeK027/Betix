import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "BETIX",
        template: "%s | BETIX",
    },
    description:
        "Plateforme SaaS premium de pronostics sportifs propulsée par l'Intelligence Artificielle. Football, Basketball, Tennis.",
    icons: {
        icon: "https://pklyygllmbfbdmfmozxq.supabase.co/storage/v1/object/public/logos/betix_logo2.png",
    },
    keywords: [
        "pronostics sportifs",
        "IA",
        "paris sportifs",
        "football",
        "basketball",
        "tennis",
        "intelligence artificielle",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className="dark">
            <body
                className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen`}
            >
                <AuthProvider>
                    <TooltipProvider delayDuration={300}>
                        {children}
                    </TooltipProvider>
                    <Toaster
                        position="bottom-right"
                        richColors
                        closeButton
                        toastOptions={{
                            duration: 5000,
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
