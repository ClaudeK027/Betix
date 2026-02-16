import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "./layout-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Initialize Server Client
    const supabase = await createClient();

    // 2. Check User Session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        // If no user at all, redirect to login is the first line of defense
        redirect("/login");
    }

    // 3. Render Client UI Shell
    // The client side will handle the precise profile hydration guard.
    return (
        <DashboardLayoutClient>
            {children}
        </DashboardLayoutClient>
    );
}
