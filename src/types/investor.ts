
export interface Investor {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  industry?: string;
  location?: string;
  role?: string;
  company?: string;
  avatar_url?: string;
  interests?: string[];
  investment_stage?: string[];
  investment_size?: string;
  min_investment?: string;
  max_investment?: string;
  preferred_stages?: string[];
  preferred_sectors?: string[];
  match_score?: number | null;
}
