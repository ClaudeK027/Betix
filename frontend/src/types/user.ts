export interface UserPreferences {
    notifications: boolean;
    newsletter: boolean;
    favoriteSports: string[];
}

export interface Badge {
    id: string;
    name: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    icon?: string;
    unlockedAt?: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar: string;
    preferences: UserPreferences;
    role?: "user" | "admin";
    created_at?: string;

    // Gamification
    rank: "Rookie" | "Pro" | "Elite" | "Legend";
    xp: number;
    nextLevelXp: number;
    level: number;
    memberSince: string;
    badges: Badge[];
}

export interface CareerStats {
    roi: number;
    winRate: number;
    wins: number;
    losses: number;
    bestStreak: number;
    currentStreak: number;
    totalProfit: number;
    avgOdds: number;
}
