
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize with a conditional
let supabase: ReturnType<typeof createClient>;

// Check if we have the required environment variables
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(
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
} else {
  console.error(
    'Missing Supabase environment variables. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.'
  );
  
  // Create a mock client that doesn't throw errors but returns appropriate values
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        }),
        insert: async () => ({ data: null, error: new Error('Supabase not configured') })
      })
    })
  } as unknown as ReturnType<typeof createClient>;
}

export { supabase };

export type User = {
  id: string;
  email: string;
  user_type: 'startup' | 'investor';
  created_at: string;
}

// Helper function to get the current user
export const getCurrentUser = async (): Promise<User | null> => {
  // Skip if Supabase is not properly configured
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
