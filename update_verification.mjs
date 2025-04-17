// Script to update verification status
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVerificationStatus() {
  try {
    // First, find the user with the given email
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', 'aryanp1117@gmail.com');

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.error('No user found with email aryanp1117@gmail.com');
      return;
    }

    console.log(`Found user with ID: ${users[0].id}`);

    // Update the user's verification status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        verified: false,
        verified_at: null,
        verified_type: null
      })
      .eq('id', users[0].id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      return;
    }

    console.log('Verification status updated successfully for user with email aryanp1117@gmail.com');
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    process.exit(0);
  }
}

updateVerificationStatus(); 