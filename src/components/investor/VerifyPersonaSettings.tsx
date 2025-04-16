import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

interface CustomQuestion {
  id: string;
  question: string;
  enabled: boolean;
}

interface PersonaSettings {
  id?: string;
  user_id: string;
  custom_questions: CustomQuestion[];
  system_prompt?: string;
}

export const VerifyPersonaSettings = ({ investorId }: { investorId?: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use the current user's ID if no investorId is provided
  const targetId = investorId || user?.id;

  useEffect(() => {
    if (targetId) {
      verifySettings();
    } else {
      setLoading(false);
      setError("No investor ID provided");
    }
  }, [targetId]);

  const verifySettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Verifying AI persona settings for investor ${targetId}`);
      
      const { data, error } = await supabase
        .from('investor_ai_persona_settings')
        .select('*')
        .eq('user_id', targetId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching AI persona settings:", error);
        setError(`Database error: ${error.message}`);
        return;
      }
      
      if (!data) {
        console.warn(`No AI persona settings found for investor ${targetId}`);
        setError("No settings found for this investor");
        return;
      }
      
      console.log("Found AI persona settings:", data);
      setSettings(data);
      
      // Validate custom_questions field
      if (!data.custom_questions) {
        console.error("custom_questions field is missing or null");
        setError("custom_questions field is missing");
        return;
      }
      
      if (!Array.isArray(data.custom_questions)) {
        console.error("custom_questions is not an array:", typeof data.custom_questions);
        setError(`custom_questions has invalid type: ${typeof data.custom_questions}`);
        return;
      }
      
      if (data.custom_questions.length === 0) {
        console.warn("custom_questions array is empty");
      } else {
        console.log(`Found ${data.custom_questions.length} custom questions:`);
        data.custom_questions.forEach((q, i) => {
          if (!q || typeof q !== 'object') {
            console.error(`Question at index ${i} is invalid:`, q);
          } else {
            console.log(`Question ${i+1}: ${q.question} (enabled: ${q.enabled !== false}, id: ${q.id || 'none'})`);
          }
        });
      }
      
      toast({
        title: "Verification Complete",
        description: data.custom_questions.length 
          ? `Found ${data.custom_questions.length} custom questions` 
          : "No custom questions found",
      });
    } catch (err) {
      console.error("Error in verification:", err);
      setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!targetId) return;
    
    setLoading(true);
    try {
      const newSettings = {
        user_id: targetId,
        custom_questions: [
          { 
            id: crypto.randomUUID(),
            question: "What problem is your startup solving?", 
            enabled: true 
          },
          { 
            id: crypto.randomUUID(),
            question: "What is your revenue model?", 
            enabled: true 
          }
        ],
        system_prompt: "You are a helpful investor AI assistant."
      };
      
      const { data, error } = await supabase
        .from('investor_ai_persona_settings')
        .upsert(newSettings)
        .select('id')
        .single();
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Created default AI persona settings",
      });
      
      verifySettings();
    } catch (error) {
      console.error("Error creating default settings:", error);
      setError(`Failed to create default settings: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Failed to create settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Persona Settings Verification</CardTitle>
        <CardDescription>
          Verify and debug investor AI persona settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="p-4 border border-destructive/30 bg-destructive/10 rounded-md flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : settings ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Settings ID</h3>
              <p className="text-xs bg-muted p-2 rounded">{settings.id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">User ID</h3>
              <p className="text-xs bg-muted p-2 rounded">{settings.user_id}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Custom Questions ({settings.custom_questions?.length || 0})</h3>
              {settings.custom_questions && settings.custom_questions.length > 0 ? (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium">Custom Questions <span className="text-xs text-primary">(Asked First)</span></h3>
                  <div className="pl-4 border-l-2 border-primary">
                    {settings.custom_questions.map((q, i) => (
                      <div
                        key={i}
                        className={`p-2 text-sm rounded my-1 ${q.enabled === false ? 'bg-muted/30 text-muted-foreground' : 'bg-secondary/30'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground block mb-1">
                              Question {i + 1} {q.enabled === false && '(Disabled)'}
                            </span>
                            {q.question}
                          </div>
                          <div className="flex flex-col items-center text-xs text-muted-foreground ml-2">
                            <span>{q.enabled === false ? 'Disabled' : 'Enabled'}</span>
                            <Badge variant={q.enabled === false ? "outline" : "default"} className="mt-1">
                              {q.id ? 'Valid ID' : 'Missing ID'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    These custom questions will be asked <strong>before</strong> the default questions
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-md mt-4">
                  <p className="text-sm font-medium">No custom questions configured</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only default questions will be used in AI conversations
                  </p>
                </div>
              )}
            </div>
            
            {settings.system_prompt && (
              <div className="mt-4">
                <h3 className="text-sm font-medium">System Prompt</h3>
                <div className="p-3 bg-secondary/20 rounded-md mt-1">
                  <p className="text-sm whitespace-pre-wrap">{settings.system_prompt}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No settings found</p>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={verifySettings} disabled={loading}>
            Refresh
          </Button>
          <Button variant="default" onClick={createDefaultSettings} disabled={loading}>
            Create Default Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 