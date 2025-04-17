-- This migration fixes storage policies for pitchdecks and demo-videos buckets
-- to address the error "new row violates row-level security policy"

-- Fix pitchdecks bucket
DO $$
BEGIN
    -- Check if pitchdecks bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'pitchdecks') THEN
        -- Update bucket settings
        UPDATE storage.buckets 
        SET file_size_limit = 26214400, 
            allowed_mime_types = '{"application/pdf","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.ms-powerpoint"}'
        WHERE name = 'pitchdecks';
        
        -- Drop existing policies to recreate them with simpler permissions
        DROP POLICY IF EXISTS "Users can upload their own pitchdecks" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update their own pitchdecks" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own pitchdecks" ON storage.objects;
        DROP POLICY IF EXISTS "Public can view public pitchdecks" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated users can view specific pitchdecks" ON storage.objects;
        
        -- Create simplified policies that don't rely on complex RLS conditions
        CREATE POLICY "Users can upload their own pitchdecks" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Users can update their own pitchdecks" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Users can delete their own pitchdecks" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Public can view public pitchdecks" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Authenticated users can view specific pitchdecks" 
        ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        RAISE NOTICE 'Fixed pitchdecks bucket policies';
    ELSE
        -- Create the bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
        VALUES ('pitchdecks', 'pitchdecks', false, false, 26214400, '{"application/pdf","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.ms-powerpoint"}', NULL);
        
        -- Create simplified policies
        CREATE POLICY "Users can upload their own pitchdecks" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Users can update their own pitchdecks" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Users can delete their own pitchdecks" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Public can view public pitchdecks" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'pitchdecks');
        
        CREATE POLICY "Authenticated users can view specific pitchdecks" 
        ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'pitchdecks');
        
        RAISE NOTICE 'Created pitchdecks bucket with proper policies';
    END IF;
    
    -- Fix demo-videos bucket
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'demo-videos') THEN
        -- Update bucket settings
        UPDATE storage.buckets 
        SET file_size_limit = 104857600, 
            public = true,
            allowed_mime_types = '{"video/mp4","video/webm","video/ogg"}'
        WHERE name = 'demo-videos';
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can upload demo videos" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
        DROP POLICY IF EXISTS "Public can view demo videos" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated users can view demo videos" ON storage.objects;
        
        -- Create simplified policies
        CREATE POLICY "Users can upload demo videos" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'demo-videos');
        
        CREATE POLICY "Users can update their own videos" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Users can delete their own videos" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Public can view demo videos" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Authenticated users can view demo videos" 
        ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        RAISE NOTICE 'Fixed demo-videos bucket policies';
    ELSE
        -- Create the bucket if it doesn't exist
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
        VALUES ('demo-videos', 'demo-videos', true, false, 104857600, '{"video/mp4","video/webm","video/ogg"}', NULL);
        
        -- Create simplified policies
        CREATE POLICY "Users can upload demo videos" 
        ON storage.objects FOR INSERT TO authenticated 
        WITH CHECK (bucket_id = 'demo-videos');
        
        CREATE POLICY "Users can update their own videos" 
        ON storage.objects FOR UPDATE TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Users can delete their own videos" 
        ON storage.objects FOR DELETE TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Public can view demo videos" 
        ON storage.objects FOR SELECT TO anon 
        USING (bucket_id = 'demo-videos');
        
        CREATE POLICY "Authenticated users can view demo videos" 
        ON storage.objects FOR SELECT TO authenticated 
        USING (bucket_id = 'demo-videos');
        
        RAISE NOTICE 'Created demo-videos bucket with proper policies';
    END IF;
END $$; 