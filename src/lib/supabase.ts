
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to empty strings to prevent immediate errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check for missing environment variables and provide a clear error message
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.'
  );
}

// Create the Supabase client with validation
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export type User = {
  id: string;
  email: string;
  user_type: 'startup' | 'investor';
  created_at: string;
}

// Helper function to get the current user
export const getCurrentUser = async (): Promise<User | null> => {
  // First check if we have environment variables before proceeding
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot get current user: Supabase environment variables are missing');
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;
    
    // Get additional user data from profiles table
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (!data) return null;
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      user_type: data.user_type,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
