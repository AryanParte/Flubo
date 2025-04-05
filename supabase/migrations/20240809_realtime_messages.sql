
-- This migration enables realtime for the messages table

-- Function to set replica identity
CREATE OR REPLACE FUNCTION public.set_messages_replica_identity()
RETURNS void AS $$
BEGIN
  ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable realtime
CREATE OR REPLACE FUNCTION public.enable_realtime_for_messages()
RETURNS void AS $$
BEGIN
  -- Create publication if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Add table to publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
