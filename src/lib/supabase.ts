
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
    
    if (!session) return null;
    
    // Get additional user data from profiles table
    // Use explicit type assertion to bypass TypeScript's type checking
    const { data } = await supabase
      .from('profiles' as any)
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (!data) return null;
    
    // Explicitly cast the data to an any type first, then extract properties safely
    const dataAny = data as any;
    
    // Validate user_type to ensure it's one of the expected values
    const userType = dataAny.user_type as string;
    if (userType !== 'startup' && userType !== 'investor') {
      console.error('Invalid user type detected:', dataAny.user_type);
      return null;
    }
    
    return {
      id: session.user.id,
      email: session.user.email || '',
      user_type: userType as 'startup' | 'investor',
      created_at: dataAny.created_at as string || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
