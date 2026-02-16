// =============================================================================
// BETIX — Client API Backend
// Fonctions pour communiquer avec le backend FastAPI
// =============================================================================

import type {
    MatchesResponse,
    PredictionsResponse,
    SportsResponse,
    Sport,
    Match,
} from "@/types";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Fetch wrapper avec gestion d'erreur.
 */
async function apiFetch<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

// --- Sports ---

export async function getSports(): Promise<SportsResponse> {
    return apiFetch<SportsResponse>("/sports");
}

// --- Matches ---

export async function getTodayMatches(
    sport?: Sport
): Promise<MatchesResponse> {
    const params = sport ? `?sport=${sport}` : "";
    return apiFetch<MatchesResponse>(`/matches/today${params}`);
}

export async function getMatch(matchId: string): Promise<Match> {
    return apiFetch<Match>(`/matches/${matchId}`);
}

// --- Predictions ---

export async function getPredictions(
    matchId: string
): Promise<PredictionsResponse> {
    return apiFetch<PredictionsResponse>(`/predictions/${matchId}`);
}
