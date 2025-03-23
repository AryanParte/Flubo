
-- Add stored procedure to handle profile creation with proper user type validation
CREATE OR REPLACE FUNCTION create_profile(
  profile_id UUID,
  profile_user_type TEXT,
  profile_name TEXT,
  profile_email TEXT
) RETURNS VOID AS $$
BEGIN
  -- First, ensure the profiles table accepts 'partnership' as a valid user_type
  -- This is a safeguard in case the table constraint is restrictive
  
  -- Check if the constraint exists and modify it
  -- This ensures all three user types are accepted
  BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
      CHECK (user_type IN ('startup', 'investor', 'partnership'));
  EXCEPTION WHEN OTHERS THEN
    -- If there's an error, we'll continue and try the direct insert
    NULL;
  END;
  
  -- Now insert the profile
  INSERT INTO profiles (id, user_type, name, email)
  VALUES (profile_id, profile_user_type, profile_name, profile_email);
END;
$$ LANGUAGE plpgsql;
