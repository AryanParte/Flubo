
export interface Startup {
  id: string;
  name: string;
  score?: number;
  stage?: string;
  location?: string;
  industry?: string;
  bio?: string;
  tagline?: string;
  raised_amount?: string;
  logo?: string; 
  website?: string;
  websiteUrl?: string;
  demoUrl?: string;
  demoVideo?: string;
  demoVideoPath?: string;
  founding_year?: string;
  team_size?: string;
  lookingForFunding?: boolean;
  lookingForDesignPartner?: boolean;
  matchSummary?: string;
  chatId?: string;
  matchStatus?: 'new' | 'viewed' | 'followed' | 'requested_demo' | 'ignored';
  created_at?: string; // Added the missing created_at property
}
