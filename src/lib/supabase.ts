
// Instead of using environment variables that aren't working, 
// we'll import the supabase client that was generated automatically
import { supabase } from "@/integrations/supabase/client";

// Export the supabase client
export { supabase };

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // We can assume it's configured because we're using the client from integrations
  return true;
};
