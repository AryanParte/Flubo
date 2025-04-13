
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { AIPersonaSettings } from "./AIPersonaSettings";
import { executeSQL } from "@/lib/db-utils";

// Get the SQL migration content 
const migrationSQL = `
-- Create a table for storing investor AI persona settings
CREATE TABLE IF NOT EXISTS investor_ai_persona_settings (
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
CREATE POLICY IF NOT EXISTS "Users can view their own AI persona settings"
  ON investor_ai_persona_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own AI persona settings
CREATE POLICY IF NOT EXISTS "Users can insert their own AI persona settings"
  ON investor_ai_persona_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI persona settings
CREATE POLICY IF NOT EXISTS "Users can update their own AI persona settings"
  ON investor_ai_persona_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own AI persona settings
CREATE POLICY IF NOT EXISTS "Users can delete their own AI persona settings"
  ON investor_ai_persona_settings
  FOR DELETE
  USING (auth.uid() = user_id);
`;

export const AIPersonaErrorHandler: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTable = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Execute the migration SQL
      const result = await executeSQL(migrationSQL);
      
      if (!result.success) {
        throw result.error;
      }
      
      setInitialized(true);
      toast({
        title: "Success",
        description: "AI Persona settings have been initialized",
      });
    } catch (err: any) {
      console.error("Error initializing AI Persona settings:", err);
      setError(err.message || "An error occurred while initializing AI Persona settings");
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: "Could not initialize AI Persona settings. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if the table exists
  const checkTableExists = async () => {
    try {
      const { data, error } = await supabase.from('investor_ai_persona_settings').select('id').limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist
        return false;
      } else if (error) {
        throw error;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking if table exists:", err);
      return false;
    }
  };

  React.useEffect(() => {
    const checkAndSetInitialized = async () => {
      const exists = await checkTableExists();
      setInitialized(exists);
    };
    
    checkAndSetInitialized();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initializing AI Persona Settings</CardTitle>
          <CardDescription>Please wait while we set up your AI Persona...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Initialization Error</CardTitle>
          <CardDescription>There was a problem setting up your AI Persona</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={initializeTable}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!initialized) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Persona Settings</CardTitle>
          <CardDescription>Set up your AI Persona to customize how you interact with startups</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            To use the AI Persona feature, we need to set up some database tables. Click the button below to initialize your AI Persona settings.
          </p>
          <Button onClick={initializeTable}>Initialize AI Persona</Button>
        </CardContent>
      </Card>
    );
  }

  // If initialized, render the actual AI Persona Settings component
  return <AIPersonaSettings />;
};
