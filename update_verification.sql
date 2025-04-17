-- Set the account with email aryanp1117@gmail.com to be unverified
UPDATE profiles
SET 
  verified = false,
  verified_at = NULL,
  verified_type = NULL
WHERE 
  email = 'aryanp1117@gmail.com'; 