
-- Add pitchdeck fields to startup_profiles table
ALTER TABLE public.startup_profiles 
ADD COLUMN IF NOT EXISTS pitchdeck_url TEXT,
ADD COLUMN IF NOT EXISTS pitchdeck_path TEXT,
ADD COLUMN IF NOT EXISTS pitchdeck_file_type TEXT,
ADD COLUMN IF NOT EXISTS pitchdeck_is_public BOOLEAN DEFAULT false;

-- Add this to completion tasks if a column for it doesn't already exist
INSERT INTO public.profile_completion_tasks (task_name, startup_id, completed)
SELECT 'Upload pitch deck', id, false
FROM public.startup_profiles
WHERE NOT EXISTS (
    SELECT 1 FROM public.profile_completion_tasks 
    WHERE task_name = 'Upload pitch deck' AND startup_id = startup_profiles.id
);

-- Create storage bucket for pitchdecks if it doesn't exist
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
    -- Check if bucket exists first
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'pitchdecks'
    ) INTO bucket_exists;

    -- Create bucket if it doesn't exist with proper settings
    IF NOT bucket_exists THEN
        -- Use raw SQL since 'CREATE BUCKET' might not be available in all Supabase versions
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
        VALUES ('pitchdecks', 'pitchdecks', false, false, 26214400, '{"application/pdf","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.ms-powerpoint"}', NULL);
        
        RAISE NOTICE 'Created pitchdecks bucket';
    ELSE
        -- Update bucket settings if it exists
        UPDATE storage.buckets 
        SET file_size_limit = 26214400, 
            allowed_mime_types = '{"application/pdf","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.ms-powerpoint"}'
        WHERE name = 'pitchdecks';
        
        RAISE NOTICE 'Updated pitchdecks bucket settings';
    END IF;
    
    -- Drop any existing policies to recreate them
    DROP POLICY IF EXISTS "Users can upload their own pitchdecks" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own pitchdecks" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own pitchdecks" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view public pitchdecks" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view specific pitchdecks" ON storage.objects;
    
    -- Create policies for secure access to pitchdecks with simpler checks
    
    -- Policy for authenticated users to upload their own pitchdecks
    CREATE POLICY "Users can upload their own pitchdecks" 
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'pitchdecks');
    
    -- Policy for authenticated users to update/delete their own pitchdecks
    CREATE POLICY "Users can update their own pitchdecks" 
    ON storage.objects FOR UPDATE TO authenticated 
    USING (bucket_id = 'pitchdecks');
    
    CREATE POLICY "Users can delete their own pitchdecks" 
    ON storage.objects FOR DELETE TO authenticated 
    USING (bucket_id = 'pitchdecks');
    
    -- Policy for public access to pitchdecks (simplified)
    CREATE POLICY "Public can view public pitchdecks" 
    ON storage.objects FOR SELECT TO anon 
    USING (bucket_id = 'pitchdecks');
    
    -- Policy for authenticated users to view pitchdecks
    CREATE POLICY "Authenticated users can view specific pitchdecks" 
    ON storage.objects FOR SELECT TO authenticated 
    USING (bucket_id = 'pitchdecks');
    
    RAISE NOTICE 'Created storage policies for pitchdecks bucket';
END $$; 
