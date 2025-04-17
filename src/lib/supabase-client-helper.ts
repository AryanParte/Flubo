
import { supabase } from "@/lib/supabase";

/**
 * This helper function is used to get the underlying Supabase client
 * for advanced operations where the TypeScript types might not fully match
 * the actual client functionality.
 * 
 * Use with caution as it bypasses TypeScript type safety.
 */
export const getSupabaseClient = () => {
  // Cast the client to any to allow accessing properties that might not be in the type definitions
  return supabase as any;
};
