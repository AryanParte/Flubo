
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Export the client from the integration folder
export const supabase = supabaseClient;

export type User = {
  id: string;
  email: string;
  user_type: 'startup' | 'investor';
  created_at: string;
}

// Helper function to get the current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No active session found');
      return null;
    }
    
    // Debugging the session
    console.log('Session user ID:', session.user.id);
    
    // Get additional user data from profiles table
    // Using the correct query pattern for Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    if (!data) {
      console.error('No profile data found for user:', session.user.id);
      return null;
    }
    
    console.log('Profile data retrieved:', data);
    
    // Validate user_type to ensure it's one of the expected values
    const userType = data.user_type as string;
    if (userType !== 'startup' && userType !== 'investor') {
      console.error('Invalid user type detected:', data.user_type);
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      user_type: userType as 'startup' | 'investor',
      created_at: data.created_at as string || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
