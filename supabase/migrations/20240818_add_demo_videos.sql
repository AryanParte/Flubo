-- Create storage bucket for demo videos if it doesn't exist
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
    -- Check if bucket exists first
    SELECT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'demo-videos'
    ) INTO bucket_exists;

    -- Create bucket if it doesn't exist with proper settings
    IF NOT bucket_exists THEN
        -- Use raw SQL instead of CREATE BUCKET
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
        VALUES ('demo-videos', 'demo-videos', true, false, 104857600, '{"video/mp4","video/webm","video/ogg"}', NULL);
        
        RAISE NOTICE 'Created demo-videos bucket';
    ELSE
        -- Update bucket settings if it exists
        UPDATE storage.buckets 
        SET file_size_limit = 104857600, 
            public = true,
            allowed_mime_types = '{"video/mp4","video/webm","video/ogg"}'
        WHERE name = 'demo-videos';
        
        RAISE NOTICE 'Updated demo-videos bucket settings';
    END IF;
    
    -- Drop existing policies and recreate them
    DROP POLICY IF EXISTS "Users can upload demo videos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
    DROP POLICY IF EXISTS "Public can view demo videos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can view demo videos" ON storage.objects;
    
    -- Policy for authenticated users to upload videos with simplified permissions
    CREATE POLICY "Users can upload demo videos" 
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'demo-videos');
    
    -- Policy for authenticated users to update/delete videos
    CREATE POLICY "Users can update their own videos" 
    ON storage.objects FOR UPDATE TO authenticated 
    USING (bucket_id = 'demo-videos');
    
    CREATE POLICY "Users can delete their own videos" 
    ON storage.objects FOR DELETE TO authenticated 
    USING (bucket_id = 'demo-videos');
    
    -- Policy for public access to videos (since demo videos bucket is public)
    CREATE POLICY "Public can view demo videos" 
    ON storage.objects FOR SELECT TO anon 
    USING (bucket_id = 'demo-videos');
    
    -- Policy for authenticated users to view videos
    CREATE POLICY "Authenticated users can view demo videos" 
    ON storage.objects FOR SELECT TO authenticated 
    USING (bucket_id = 'demo-videos');
    
    RAISE NOTICE 'Created storage policies for demo-videos bucket';
END $$; 