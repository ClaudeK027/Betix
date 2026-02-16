import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("[API/SignOut] Atomic signout initiated...");

    // 1. Initialize Server Client
    const supabase = await createClient();

    // 2. Check if user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        // 3. Sign out on Supabase side (invalidates server-side session)
        await supabase.auth.signOut();
        console.log(`[API/SignOut] Session invalidated for user: ${user.id}`);
    }

    // 4. We don't use revalidatePath("/", "layout") here because it causes global cache invalidation
    // which can interfere with other active browser sessions (Chrome/Edge conflict).
    // The client-side window.location.replace("/login") is sufficient to clear the 
    // current user's router cache.

    // 5. Return redirect to login
    return NextResponse.redirect(new URL("/login", req.url), {
        status: 302,
    });
}
