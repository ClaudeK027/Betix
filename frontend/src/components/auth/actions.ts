"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function logoutAction() {
    console.log("[AuthAction] Executing server-side logout...");
    const supabase = await createClient();

    // 1. Sign out on Supabase server (invalidates session)
    await supabase.auth.signOut();

    // 2. Redirect to login
    // In Server Actions, redirect() clears cache and navigates.
    redirect("/login");
}
