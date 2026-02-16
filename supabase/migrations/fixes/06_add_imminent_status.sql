-- Add 'imminent' to allowed status values in public.matches

-- 1. Drop the existing check constraint
ALTER TABLE public.matches DROP CONSTRAINT matches_status_check;

-- 2. Add the new constraint including 'imminent'
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('upcoming', 'imminent', 'live', 'finished'));

-- 3. (Optional) If we want analytics.football_matches/basketball_matches to also support it?
-- The analytics tables usually track raw API status. 
-- 'imminent' is a frontend/public concept. So we only touch public.matches.
