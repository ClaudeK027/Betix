import { Bot, Sparkles } from "lucide-react";
import { FootballIcon, BasketballIcon, TennisIcon } from "@/components/icons/SportIcons";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
