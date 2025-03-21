
import { createClient } from "@supabase/supabase-js";

// Fallback to empty strings to prevent initialization errors
// This will make the app load, but Supabase functionality won't work 
// until proper credentials are provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Log if environment variables are missing for debugging purposes
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
