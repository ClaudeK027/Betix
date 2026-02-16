
-- Add ai_analysis column to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS ai_analysis TEXT DEFAULT NULL;
