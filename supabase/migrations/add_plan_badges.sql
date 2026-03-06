-- Add configurable badge fields to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS badge_color text;

-- Seed existing plans with their current hardcoded badges
-- (Optional: adjust these to match your current plan IDs)
COMMENT ON COLUMN public.plans.badge_text IS 'Marketing badge text displayed on the pricing card, e.g. POPULAIRE, BEST VALUE';
COMMENT ON COLUMN public.plans.badge_color IS 'Tailwind CSS classes for badge styling, e.g. bg-amber-500 text-black';
