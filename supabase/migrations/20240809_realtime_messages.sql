
-- Function to set replica identity full on messages table
CREATE OR REPLACE FUNCTION public.set_messages_replica_identity()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- First check if the table is set to FULL already to avoid errors
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.messages'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'messages table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.messages REPLICA IDENTITY FULL;
    END IF;
  END $$;
  
  -- Do the same for other important tables
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.investor_preferences'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'investor_preferences table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.investor_preferences REPLICA IDENTITY FULL;
    END IF;
  END $$;
  
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.startup_notification_settings'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'startup_notification_settings table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.startup_notification_settings REPLICA IDENTITY FULL;
    END IF;
  END $$;
  
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.startup_profiles'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'startup_profiles table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.startup_profiles REPLICA IDENTITY FULL;
    END IF;
  END $$;
  
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.post_likes'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'post_likes table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
    END IF;
  END $$;
  
  DO $$
  DECLARE
    current_identity TEXT;
  BEGIN
    SELECT relreplident::TEXT INTO current_identity 
    FROM pg_class WHERE oid = 'public.comments'::regclass;
    
    IF current_identity != 'f' THEN
      RAISE NOTICE 'comments table already has replica identity set to %', current_identity;
    ELSE
      ALTER TABLE public.comments REPLICA IDENTITY FULL;
    END IF;
  END $$;
$$;

-- Function to enable realtime for messages table
CREATE OR REPLACE FUNCTION public.enable_realtime_for_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create publication for tables if it doesn't exist
  CREATE PUBLICATION IF NOT EXISTS supabase_realtime;
  
  -- Add tables to the publication
  -- Using conditional logic to avoid errors if tables are already in publication
  PERFORM pg_catalog.pg_publication_tables('supabase_realtime');
  
  -- Safer approach: try/catch for each table
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'messages table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_preferences;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'investor_preferences table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_notification_settings;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'startup_notification_settings table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_profiles;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'startup_profiles table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'post_likes table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'comments table is already in publication';
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION 
    WHEN duplicate_object THEN 
      RAISE NOTICE 'posts table is already in publication';
  END;
  
  -- Insert channels into supabase_realtime.realtime_channels
  INSERT INTO supabase_realtime.realtime_channels (name)
  VALUES ('startup-messages'), ('investor-messages'), ('preference-updates'), 
         ('startup-profiles'), ('post-comments'), ('post-likes')
  ON CONFLICT (name) DO NOTHING;
  
  -- Insert subscription rules with enhanced filters
  INSERT INTO supabase_realtime.subscription (entity, filters, claims)
  VALUES 
    ('public:messages', '{}', '{"role":"authenticated"}'),
    ('public:investor_ai_searches', '{}', '{"role":"authenticated"}'),
    ('public:investor_preferences', '{}', '{"role":"authenticated"}'),
    ('public:startup_notification_settings', '{}', '{"role":"authenticated"}'),
    ('public:startup_profiles', '{}', '{"role":"authenticated"}'),
    ('public:comments', '{}', '{"role":"authenticated"}'),
    ('public:post_likes', '{}', '{"role":"authenticated"}'),
    ('public:posts', '{}', '{"role":"authenticated"}')
  ON CONFLICT DO NOTHING;
  
  -- Verify that tables are properly set up with REPLICA IDENTITY FULL
  PERFORM set_messages_replica_identity();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_messages_replica_identity TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_realtime_for_messages TO authenticated;
