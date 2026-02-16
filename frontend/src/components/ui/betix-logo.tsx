import Image from "next/image";
import { cn } from "@/lib/utils";

interface BetixLogoProps {
    className?: string;
    variant?: "default" | "icon"; // default = responsive switch, icon = force icon
}

export function BetixLogo({ className, variant = "default" }: BetixLogoProps) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const logoFull = `${supabaseUrl}/storage/v1/object/public/logos/betix_logo.png`;
    const logoIcon = `${supabaseUrl}/storage/v1/object/public/logos/betix_logo2.png`;

    if (variant === "icon") {
        return (
            <div className={cn("relative aspect-square", className)}>
                <Image
                    src={logoIcon}
                    alt="Betix Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        );
    }

    return (
        <div className={cn("relative flex items-center", className)}>
            {/* Mobile: Icon Only (if variant is default, show icon on small screens) */}
            <div className="block md:hidden relative size-8">
                <Image
                    src={logoIcon}
                    alt="Betix Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>

            {/* Desktop: Full Logo */}
            <div className="hidden md:block relative w-32 h-10">
                <Image
                    src={logoFull}
                    alt="Betix Logo"
                    fill
                    className="object-contain object-left"
                    priority
                />
            </div>
        </div>
    );
}
