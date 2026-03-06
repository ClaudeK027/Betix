"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Maps font config keys to the CSS variable names defined by next/font on <body>.
 */
const FONT_VAR_MAP: Record<string, string> = {
    inter:           "--font-inter",
    montserrat:      "--font-montserrat",
    "space-grotesk": "--font-space-grotesk",
    "dm-sans":       "--font-dm-sans",
    poppins:         "--font-poppins",
    raleway:         "--font-raleway",
    outfit:          "--font-outfit",
    "plus-jakarta":  "--font-plus-jakarta",
    nunito:          "--font-nunito",
};

function applyAccentColor(hex: string) {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", hex);
    root.style.setProperty("--color-accent", hex);
    root.style.setProperty("--color-ring", hex);
    root.style.setProperty("--color-sidebar-primary", hex);
    root.style.setProperty("--color-sidebar-ring", hex);
    root.style.setProperty("--color-chart-1", hex);
}

function applyFont(fontKey: string) {
    const cssVar = FONT_VAR_MAP[fontKey];
    if (!cssVar) return;

    // next/font defines --font-xxx on <body>, so we read the computed value
    // from body and set the resolved font-family string on <html>.
    const resolved = getComputedStyle(document.body).getPropertyValue(cssVar).trim();
    if (resolved) {
        document.documentElement.style.setProperty("--font-sans", resolved);
    }
}

function applyRadius(px: string) {
    document.documentElement.style.setProperty("--radius", `${px}px`);
}

function applyCardOpacity(percent: string) {
    const alpha = (parseInt(percent) || 40) / 100;
    document.documentElement.style.setProperty("--card-opacity", String(alpha));
}

function applyConfig(key: string, value: string) {
    switch (key) {
        case "ui.font_family":
            applyFont(value);
            break;
        case "ui.accent_color":
            applyAccentColor(value);
            break;
        case "ui.border_radius":
            applyRadius(value);
            break;
        case "ui.card_opacity":
            applyCardOpacity(value);
            break;
    }
}

interface SystemConfig {
    key: string;
    value: string;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [loaded, setLoaded] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // 1. Fetch all ui.* configs on mount
        const init = async () => {
            try {
                const { data } = await supabase
                    .from("system_config")
                    .select("key, value")
                    .like("key", "ui.%");

                data?.forEach((row: SystemConfig) => applyConfig(row.key, row.value));
            } catch (e) {
                console.warn("ThemeProvider: could not load visual config", e);
            } finally {
                setLoaded(true);
            }
        };

        init();

        // 2. Subscribe to realtime changes on ui.* keys
        const channel = supabase
            .channel("theme_config_realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "system_config" },
                (payload) => {
                    const record = payload.new as SystemConfig;
                    if (record?.key?.startsWith("ui.")) {
                        applyConfig(record.key, record.value);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Render children immediately — CSS vars default to globals.css values
    // until the DB config loads (no flash).
    return <>{children}</>;
}
