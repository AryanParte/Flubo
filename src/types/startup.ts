
export type Startup = {
  id: string;
  name: string;
  score?: number;
  stage?: string;
  location?: string;
  industry?: string;
  bio?: string;
  raised_amount?: string;
  tagline?: string;
  matchSummary?: string;
  chatId?: string;
  matchStatus?: 'new' | 'viewed' | 'followed' | 'requested_demo' | 'ignored';
};
