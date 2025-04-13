
-- Create a table for storing investor AI persona settings
CREATE TABLE investor_ai_persona_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_questions JSONB DEFAULT '[]'::jsonb,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create RLS policies for the AI persona settings table
ALTER TABLE investor_ai_persona_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI persona settings
CREATE POLICY "Users can view their own AI persona settings"
  ON investor_ai_persona_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI persona settings
CREATE POLICY "Users can insert their own AI persona settings"
  ON investor_ai_persona_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI persona settings
CREATE POLICY "Users can update their own AI persona settings"
  ON investor_ai_persona_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own AI persona settings
CREATE POLICY "Users can delete their own AI persona settings"
  ON investor_ai_persona_settings
  FOR DELETE
  USING (auth.uid() = user_id);
