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
        <div className={cn("relative flex items-center h-8 md:h-10 w-24 md:w-32", className)}>
            <Image
                src={logoFull}
                alt="Betix Logo"
                fill
                className="object-contain object-left"
                priority
            />
        </div>
    );
}
