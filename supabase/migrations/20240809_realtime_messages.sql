
-- Function to set replica identity full on messages table
CREATE OR REPLACE FUNCTION public.set_messages_replica_identity()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  ALTER TABLE public.messages REPLICA IDENTITY FULL;
$$;

-- Function to enable realtime for messages table
CREATE OR REPLACE FUNCTION public.enable_realtime_for_messages()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  BEGIN
    INSERT INTO supabase_realtime.realtime_channels (name)
    VALUES ('startup-messages'), ('investor-messages')
    ON CONFLICT (name) DO NOTHING;
  
    INSERT INTO supabase_realtime.subscription (entity, filters, claims)
    VALUES 
      ('public:messages', '{}', '{"role":"authenticated"}')
    ON CONFLICT DO NOTHING;
  END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_messages_replica_identity TO authenticated;
GRANT EXECUTE ON FUNCTION public.enable_realtime_for_messages TO authenticated;
