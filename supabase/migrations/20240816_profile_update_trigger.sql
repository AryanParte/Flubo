-- This migration adds a trigger that updates posts data when profiles are updated
-- This ensures that company and other profile data changes are reflected in real-time

-- First, ensure posts table has a proper updated_at column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure the profiles table has a proper updated_at column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create function that will be called when profiles are updated
CREATE OR REPLACE FUNCTION refresh_posts_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Touch the updated_at field of posts authored by this user
    -- This will trigger real-time updates for subscribers
    UPDATE public.posts
    SET updated_at = now()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS trigger_refresh_posts_on_profile_update ON public.profiles;

-- Create trigger to call the function on profile updates
CREATE TRIGGER trigger_refresh_posts_on_profile_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION refresh_posts_on_profile_update();

-- Enable replica identity for real-time updates
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL; 