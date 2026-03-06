
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging purposes (since dotenv is flaky in this env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase constants.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedProfile(email) {
    console.log(`\n🌱 Seeding profile data for: ${email}`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        console.error("❌ Error listing users:", userError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error(`❌ User ${email} not found in auth.users.`);
        return;
    }
    console.log(`✅ User found: ${user.id}`);

    // 2. Upsert Profile (Lilzer Persona)
    console.log("... Seeding public.profiles");
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            username: 'Lilzer',
            avatar_url: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lilzer',
            role: 'user', // Admins don't have profiles
            onboarding_completed: true,
            betting_style: 'analytical', // Lowercase to match check constraint
            favorite_sports: ['football', 'tennis'],
            created_at: '2026-01-15T10:00:00Z'
        });
    if (profileError) console.error("❌ Profile Error:", profileError);

    // 3. Upsert User Settings
    console.log("... Seeding public.user_settings");
    const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
            user_id: user.id,
            theme: 'dark',
            notifications_push: true,
            newsletter_opt_in: false
        });
    if (settingsError) console.error("❌ Settings Error:", settingsError);

    // 4. Upsert User Stats (Performance Center)
    console.log("... Seeding public.user_stats");
    const { error: statsError } = await supabase
        .from('user_stats')
        .upsert({
            user_id: user.id,
            level: 42,
            xp_current: 8450,
            xp_next: 10000,
            total_bets: 124,
            win_rate: 62.9,
            roi: 12.5,
            current_streak: 3,
            total_profit: 450.25
        });
    if (statsError) console.error("❌ Stats Error:", statsError);

    // 5. Upsert Badges
    console.log("... Seeding public.badges");
    const badgesData = [
        { id: 'sharpshooter', name: 'Sharpshooter', icon_ref: 'crosshair', description: "5 paris gagnants d'affilée", rarity: 'epic' },
        { id: 'early_adopter', name: 'Early Adopter', icon_ref: 'rocket', description: "Membre fondateur", rarity: 'legendary' },
        { id: 'nba_expert', name: 'NBA Expert', icon_ref: 'basketball', description: "+20% ROI sur le Basket", rarity: 'rare' }
    ];
    const { error: badgesError } = await supabase
        .from('badges')
        .upsert(badgesData);
    if (badgesError) console.error("❌ Badges Error:", badgesError);

    // 6. Link Badges to User
    console.log("... Seeding public.user_badges");
    const userBadgesData = badgesData.map(b => ({
        user_id: user.id,
        badge_id: b.id,
        unlocked_at: new Date().toISOString()
    }));
    const { error: userBadgesError } = await supabase
        .from('user_badges')
        .upsert(userBadgesData);
    if (userBadgesError) console.error("❌ User Badges Error:", userBadgesError);

    // 7. Upsert Plans
    console.log("... Seeding public.plans");
    const plansData = [
        { id: 'free', name: 'Free Starter', price: 0, features: ['Daily Free Pick', 'Basic Stats'] },
        { id: 'premium_monthly', name: 'The Insider (Monthly)', price: 9.99, features: ['Analyses Illimitées', 'xG en temps réel', 'Support Prioritaire'] },
        { id: 'premium_annual', name: 'The Insider (Annual)', price: 99.99, features: ['All Premium Features', '2 Months Free'] }
    ];
    // Note: Schema says plans has mollie_plan_id, but it's nullable for now.
    const { error: plansError } = await supabase
        .from('plans')
        .upsert(plansData);
    if (plansError) console.error("❌ Plans Error:", plansError);

    // 8. Upsert Subscription
    console.log("... Seeding public.subscriptions");
    const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: user.id,
            plan_id: 'premium_monthly',
            status: 'active',
            current_period_end: '2026-03-11T00:00:00Z',
            source: 'manual_gift'
        });
    if (subError) console.error("❌ Subscription Error:", subError);

    console.log("\n✅ Seeding complete!");
}

const email = process.argv[2] || 'user@betix.io';
seedProfile(email).catch(console.error);
