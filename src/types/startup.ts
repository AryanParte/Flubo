export interface Startup {
  id: string;
  name: string;
  tagline?: string;
  bio?: string;
  industry?: string;
  location?: string;
  stage?: string;
  foundedYear?: string;
  logo?: string;
  website?: string;
  websiteUrl?: string;
  demoUrl?: string;
  demoVideo?: string;
  demoVideoPath?: string;
  pitchdeckUrl?: string;
  pitchdeckPath?: string;
  pitchdeckFileType?: string;
  pitchdeckIsPublic?: boolean;
  score?: number;
  raisedAmount?: string;
  lookingForFunding?: boolean;
  lookingForDesignPartner?: boolean;
  stealthMode?: boolean;
  
  // AI match specific fields
  chatId?: string;
  matchStatus?: 'new' | 'viewed' | 'followed' | 'requested_demo' | 'ignored';
  matchSummary?: string;
  
  // Additional fields needed
  createdAt?: string;
  teamSize?: number;
}
