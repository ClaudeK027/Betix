-- =============================================================================
-- FIX: ADD UNIQUE CONSTRAINT TO PUBLC.MATCHES
-- =============================================================================
-- Description:
-- Adds a unique constraint on (api_sport_id, sport) to the public.matches table.
-- This is REQUIRED for the ingestion pipeline to perform UPSERT operations.
-- Without this, the pipeline fails with "400 Bad Request".
-- =============================================================================

-- 1. Ensure columns are not null (required for unique constraint reliability)
ALTER TABLE public.matches 
ALTER COLUMN api_sport_id SET NOT NULL;

-- 2. Add the unique constraint
ALTER TABLE public.matches
ADD CONSTRAINT matches_api_sport_unique UNIQUE (api_sport_id, sport);

-- 3. (Optional) Drop the old simple index if it exists, as the unique constraint creates one
DROP INDEX IF EXISTS idx_matches_api_id;
