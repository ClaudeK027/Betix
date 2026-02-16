-- Fix team codes for major teams in analytics.teams
-- Correcting generic API codes to official acronyms

-- Football
UPDATE analytics.teams SET short_name = 'PSG' WHERE name = 'Paris Saint Germain' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'RMA' WHERE name = 'Real Madrid' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'OM' WHERE name = 'Marseille' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'OL' WHERE name = 'Lyon' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'FCB' WHERE name = 'Bayern München' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'MU' WHERE name = 'Manchester United' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'MCI' WHERE name = 'Manchester City' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'SB29' WHERE name = 'Stade Brestois 29' AND sport = 'football';
UPDATE analytics.teams SET short_name = 'ASSE' WHERE name = 'Saint Etienne' AND sport = 'football';

-- Update public.matches to reflect these changes ? 
-- Actually, the public.matches table copies the code at ingestion time. 
-- We should also update the existing matches in public.matches to match the new codes.

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"PSG"') 
WHERE home_team->>'name' = 'Paris Saint Germain' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"PSG"') 
WHERE away_team->>'name' = 'Paris Saint Germain' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"RMA"') 
WHERE home_team->>'name' = 'Real Madrid' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"RMA"') 
WHERE away_team->>'name' = 'Real Madrid' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"OM"') 
WHERE home_team->>'name' = 'Marseille' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"OM"') 
WHERE away_team->>'name' = 'Marseille' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"OL"') 
WHERE home_team->>'name' = 'Lyon' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"OL"') 
WHERE away_team->>'name' = 'Lyon' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"FCB"') 
WHERE home_team->>'name' = 'Bayern München' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"FCB"') 
WHERE away_team->>'name' = 'Bayern München' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"MU"') 
WHERE home_team->>'name' = 'Manchester United' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"MU"') 
WHERE away_team->>'name' = 'Manchester United' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"MCI"') 
WHERE home_team->>'name' = 'Manchester City' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"MCI"') 
WHERE away_team->>'name' = 'Manchester City' AND sport = 'football';

UPDATE public.matches 
SET home_team = jsonb_set(home_team, '{code}', '"SB29"') 
WHERE home_team->>'name' = 'Stade Brestois 29' AND sport = 'football';

UPDATE public.matches 
SET away_team = jsonb_set(away_team, '{code}', '"SB29"') 
WHERE away_team->>'name' = 'Stade Brestois 29' AND sport = 'football';
