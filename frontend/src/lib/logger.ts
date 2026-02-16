import { toast } from "sonner";

export type LogLevel = "info" | "warn" | "error" | "success";

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
    source?: string;
}

class Logger {
    private logs: LogEntry[] = [];
    private listeners: ((logs: LogEntry[]) => void)[] = [];
    private maxLogs = 1000;

    constructor() {
        // Load from sessionStorage if available (client-side only)
        if (typeof window !== "undefined") {
            try {
                const stored = sessionStorage.getItem("betix_admin_logs");
                if (stored) {
                    this.logs = JSON.parse(stored);
                }
            } catch (e) {
                console.error("Failed to load logs from session", e);
            }
        }
    }

    private persist() {
        if (typeof window !== "undefined") {
            try {
                sessionStorage.setItem("betix_admin_logs", JSON.stringify(this.logs.slice(0, 500))); // Keep last 500 in session
            } catch (e) {
                // Ignore storage errors
            }
        }
    }

    private notify() {
        this.listeners.forEach(l => l([...this.logs]));
    }

    public subscribe(listener: (logs: LogEntry[]) => void) {
        this.listeners.push(listener);
        listener([...this.logs]); // Initial emit
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public log(level: LogLevel, message: string, data?: any, source: string = "System") {
        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level,
            message,
            data,
            source
        };

        this.logs = [entry, ...this.logs].slice(0, this.maxLogs);
        this.persist();
        this.notify();

        // Also log to console for devtools
        const style = level === 'error' ? 'color: red' : level === 'warn' ? 'color: orange' : 'color: cyan';
        console.log(`%c[${source}] ${message}`, style, data || '');

        // Toast on critical errors only
        if (level === 'error') {
            toast.error(message);
        }
    }

    public info(message: string, data?: any, source?: string) { this.log("info", message, data, source); }
    public warn(message: string, data?: any, source?: string) { this.log("warn", message, data, source); }
    public error(message: string, data?: any, source?: string) { this.log("error", message, data, source); }
    public success(message: string, data?: any, source?: string) { this.log("success", message, data, source); }

    public clear() {
        this.logs = [];
        this.persist();
        this.notify();
    }

    public getLogs() {
        return [...this.logs];
    }
}

export const logger = new Logger();
