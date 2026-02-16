
-- Update the 'logos' bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'logos';

-- Create a policy to allow public read access to 'logos'
-- We use DO block to avoid error if policy already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Public Access Logos'
    ) THEN
        CREATE POLICY "Public Access Logos"
        ON storage.objects FOR SELECT
        TO public
        USING ( bucket_id = 'logos' );
    END IF;
END $$;
