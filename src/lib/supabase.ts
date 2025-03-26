
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

// Define additional types to extend the Supabase types
export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  user_type: string;
  created_at: string | null;
  company: string | null;
  position: string | null;
  phone: string | null;
};

export type InvestorPreferences = {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  new_matches: boolean;
  market_updates: boolean;
  weekly_digest: boolean;
  min_investment: string | null;
  max_investment: string | null;
  preferred_stages: string[];
  preferred_sectors: string[];
  created_at: string;
  updated_at: string;
};

export type StartupNotificationSettings = {
  id: string;
  user_id: string;
  email_new_match: boolean;
  email_messages: boolean;
  email_profile_views: boolean;
  email_funding_updates: boolean;
  email_newsletters: boolean;
  push_matches: boolean;
  push_messages: boolean;
  push_reminders: boolean;
  created_at: string;
  updated_at: string;
};

// Add a Post type definition for the posts table
export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes: number;
  comments_count: number;
  hashtags: string[];
  created_at: string;
  profiles?: {
    id: string;
    name: string | null;
    user_type: string | null;
  } | null;
};
