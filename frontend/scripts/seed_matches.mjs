
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Try root
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Try frontend
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Service Role Key.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEAMS = {
    football: [
        { name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", code: "ARS" },
        { name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", code: "LIV" },
        { name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", code: "RMA" },
        { name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", code: "BAR" },
        { name: "PSG", logo: "https://media.api-sports.io/football/teams/85.png", code: "PSG" },
        { name: "Marseille", logo: "https://media.api-sports.io/football/teams/81.png", code: "OM" },
        { name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png", code: "BAY" },
        { name: "Dortmund", logo: "https://media.api-sports.io/football/teams/165.png", code: "BVB" },
    ],
    basketball: [
        { name: "Lakers", logo: "https://media.api-sports.io/basketball/teams/145.png", code: "LAL" },
        { name: "Warriors", logo: "https://media.api-sports.io/basketball/teams/146.png", code: "GSW" },
        { name: "Celtics", logo: "https://media.api-sports.io/basketball/teams/138.png", code: "BOS" },
        { name: "Heat", logo: "https://media.api-sports.io/basketball/teams/143.png", code: "MIA" },
    ],
    tennis: [
        { name: "Djokovic N.", logo: "https://media.api-sports.io/tennis/players/151.png", code: "DJOK" },
        { name: "Alcaraz C.", logo: "https://media.api-sports.io/tennis/players/26578.png", code: "ALCA" },
        { name: "Sinner J.", logo: "https://media.api-sports.io/tennis/players/20691.png", code: "SINN" },
        { name: "Medvedev D.", logo: "https://media.api-sports.io/tennis/players/156.png", code: "MEDV" },
    ]
};

const LEAGUES = {
    football: ["Premier League", "La Liga", "Ligue 1", "Bundesliga", "Champions League"],
    basketball: ["NBA", "EuroLeague"],
    tennis: ["ATP Miami", "Wimbledon"]
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getDate = (offsetHours) => {
    const date = new Date();
    date.setHours(date.getHours() + offsetHours);
    return date.toISOString();
};

async function seedMatches() {
    console.log("🌱 Seeding 20 mock matches (V2 - Schema aligned)...");

    const matches = [];

    // Distribution: 12 Football, 5 Basketball, 3 Tennis
    const distribution = [
        { count: 12, sport: 'football' },
        { count: 5, sport: 'basketball' },
        { count: 3, sport: 'tennis' }
    ];

    for (const dist of distribution) {
        for (let i = 0; i < dist.count; i++) {
            const teamA = getRandom(TEAMS[dist.sport]);
            let teamB = getRandom(TEAMS[dist.sport]);
            while (teamB.name === teamA.name) teamB = getRandom(TEAMS[dist.sport]);

            const status = getRandom(['upcoming', 'upcoming', 'live', 'finished']);

            const date_time = status === 'finished' ? getDate(-24 - Math.floor(Math.random() * 48)) :
                status === 'live' ? getDate(0) :
                    getDate(1 + Math.floor(Math.random() * 72));

            let score = null;
            if (status !== 'upcoming') {
                if (dist.sport === 'football') {
                    score = { home: Math.floor(Math.random() * 4), away: Math.floor(Math.random() * 4), mtime: status === 'live' ? "75'" : "90'" };
                } else if (dist.sport === 'basketball') {
                    score = { home: 80 + Math.floor(Math.random() * 40), away: 80 + Math.floor(Math.random() * 40), mtime: status === 'live' ? "Q4" : "FT" };
                } else {
                    score = { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3), mtime: "FT" };
                }
            }

            matches.push({
                sport: dist.sport,
                league_name: getRandom(LEAGUES[dist.sport]),
                home_team: { name: teamA.name, logo: teamA.logo, code: teamA.code },
                away_team: { name: teamB.name, logo: teamB.logo, code: teamB.code },
                date_time: date_time,
                status: status,
                score: score,
                tournament_meta: { round: "Regular Season", neutral_ground: false }
            });
        }
    }

    // Insert
    const { error } = await supabase.from('matches').insert(matches);

    if (error) {
        console.error("❌ Error inserting matches:", error);
    } else {
        console.log("✅ Successfully inserted 20 matches with correct schema!");
    }
}

seedMatches();
