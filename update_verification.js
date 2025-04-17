// Script to update verification status
import { createClient } from '@supabase/supabase-js';

// Replace these with actual env values from your project
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

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
  }
}

updateVerificationStatus(); 