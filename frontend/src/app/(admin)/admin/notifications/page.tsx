"use client";

import { useState } from "react";
import { SystemNotification } from "@/types/admin";
import { SignalProcessor } from "@/components/admin/notifications/SignalProcessor";
import { HolographicStream } from "@/components/admin/notifications/HolographicStream";
import { CommsConfig } from "@/components/admin/notifications/CommsConfig";
import { Button } from "@/components/ui/button";
import { Check, Settings, Shield, Radio } from "lucide-react";

export default function AdminNotificationsPage() {
    const [filter, setFilter] = useState<"all" | "system" | "user" | "critical">("all");
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [notifications, setNotifications] = useState<SystemNotification[]>([]);

    // Calculate counts for badges
    const counts = {
        all: notifications.filter(n => !n.read).length,
        system: notifications.filter(n => n.type === "system" && !n.read).length,
        user: notifications.filter(n => n.type === "user" && !n.read).length,
        critical: notifications.filter(n => n.severity === "critical" && !n.read).length
    };

    const filtered = notifications.filter(n => {
        if (filter === "all") return true;
        if (filter === "critical") return n.severity === "critical";
        return n.type === filter;
    });

    const handleMarkRead = (id: string | "all") => {
        if (id === "all") {
            setNotifications(current => current.map(n => ({ ...n, read: true })));
        } else {
            setNotifications(current => current.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">

            {/* Command Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2">Comms Deck</h1>
                    <p className="text-sm font-mono text-neutral-500 flex items-center gap-2">
                        <Radio className="size-3.5 animate-pulse text-emerald-500" />
                        SIGNAL_INT_ESTABLISHED :: ENCRYPTED_CHANNEL
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => handleMarkRead("all")}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 font-mono text-xs gap-2"
                    >
                        <Check className="size-3.5" /> CLEAR_BUFFER
                    </Button>
                    <Button
                        onClick={() => setIsConfigOpen(true)}
                        size="sm"
                        className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold tracking-wide border border-white/10 gap-2"
                    >
                        <Settings className="size-3.5" /> COMMS_CONFIG
                    </Button>
                </div>
            </div>

            {/* Signal Processor (Filter Tabs) */}
            <SignalProcessor
                filter={filter}
                counts={counts}
                onFilterChange={setFilter}
            />

            {/* Holographic Stream (The Feed) */}
            <HolographicStream
                notifications={filtered}
                onMarkRead={handleMarkRead}
            />

            {/* Footer Status */}
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-600 pt-4 border-t border-white/5">
                <span>BUFFER_CAPACITY: 85%</span>
                <span className="flex items-center gap-2">
                    <Shield className="size-3" /> SECURE_CONNECTION_TLS_1.3
                </span>
            </div>

            {/* Settings Side Panel */}
            <CommsConfig
                open={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
            />

        </div>
    );
}
