-- =============================================================================
-- FIX PERMISSIONS: ANALYTICS SCHEMA
-- =============================================================================
-- Description:
-- Grants necessary permissions to the 'service_role' (and 'postgres') 
-- to access and modify tables in the 'analytics' schema.
-- This is required to fix the "403 Forbidden" error during data ingestion.
-- =============================================================================

-- 1. Grant USAGE on the schema
GRANT USAGE ON SCHEMA analytics TO service_role;
GRANT USAGE ON SCHEMA analytics TO postgres;
GRANT USAGE ON SCHEMA analytics TO anon; -- (Optional, if public read needed later)
GRANT USAGE ON SCHEMA analytics TO authenticated; -- (Optional)

-- 2. Grant ALL privileges on ALL TABLES in the schema
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO postgres;

-- 3. Grant ALL privileges on ALL SEQUENCES (for SERIAL ids)
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO postgres;

-- 4. Ensure future tables also get these permissions (Optional but recommended)
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON SEQUENCES TO service_role;
