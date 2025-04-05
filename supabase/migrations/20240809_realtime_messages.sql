
-- Function to set replica identity full on messages table
CREATE OR REPLACE FUNCTION public.set_messages_replica_identity()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.investor_preferences REPLICA IDENTITY FULL;
  ALTER TABLE public.startup_notification_settings REPLICA IDENTITY FULL;
  ALTER TABLE public.startup_profiles REPLICA IDENTITY FULL;
  ALTER TABLE public.post_likes REPLICA IDENTITY FULL;
  ALTER TABLE public.comments REPLICA IDENTITY FULL;
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
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_preferences;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_notification_settings;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.startup_profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  
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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_messages_replica_identity TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_realtime_for_messages TO authenticated;
