
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export type User = {
  id: string;
  email: string;
  user_type: 'startup' | 'investor';
  created_at: string;
}

// Helper function to get the current user
export const getCurrentUser = async (): Promise<User | null> => {
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
};
