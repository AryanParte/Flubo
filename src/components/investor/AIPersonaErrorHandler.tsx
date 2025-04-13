
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface CustomQuestion {
  id: string;
  question: string;
  enabled: boolean;
}

interface PersonaSettings {
  id?: string;
  user_id: string;
  custom_questions: CustomQuestion[];
}

export const AIPersonaErrorHandler: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [newQuestion, setNewQuestion] = useState("");

  // Default questions that cannot be removed
  const defaultQuestions = [
    "Tell me about your business model?",
    "What traction do you have so far?",
    "Who are your competitors and how do you differentiate?",
    "What's your go-to-market strategy?",
    "Tell me about your team background?"
  ];

  // Initialize by fetching existing settings or creating new ones
  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('investor_ai_persona_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSettings(data);
      } else if (user) {
        // Initialize with empty settings if not found
        setSettings({
          user_id: user.id,
          custom_questions: []
        });
      }
    } catch (error) {
      console.error("Error fetching AI persona settings:", error);
      // Create a default settings object if we couldn't fetch
      if (user) {
        setSettings({
          user_id: user.id,
          custom_questions: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user || !settings) return;
    
    setSaving(true);
    
    try {
      // Prepare the data to save
      const dataToSave = {
        user_id: user.id,
        custom_questions: settings.custom_questions,
        updated_at: new Date().toISOString()
      };
      
      if (settings.id) {
        // Update existing settings
        const { error } = await supabase
          .from('investor_ai_persona_settings')
          .update(dataToSave)
          .eq('id', settings.id);
          
        if (error) throw error;
      } else {
        // Insert new settings
        const { data, error } = await supabase
          .from('investor_ai_persona_settings')
          .insert(dataToSave)
          .select('id')
          .single();
          
        if (error) throw error;
        
        // Update local state with the new ID
        setSettings(prev => prev ? { ...prev, id: data.id } : null);
      }
      
      toast({
        title: "Success",
        description: "AI Persona questions saved successfully",
      });
    } catch (error) {
      console.error("Error saving AI persona settings:", error);
      toast({
        title: "Error",
        description: "Failed to save AI persona questions",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    if (!settings || !newQuestion.trim()) return;
    
    // Add new question with a unique ID
    const newCustomQuestion: CustomQuestion = {
      id: crypto.randomUUID(),
      question: newQuestion.trim(),
      enabled: true
    };
    
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        custom_questions: [...prev.custom_questions, newCustomQuestion]
      };
    });
    
    // Reset input
    setNewQuestion("");
  };

  const removeQuestion = (id: string) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        custom_questions: prev.custom_questions.filter(q => q.id !== id)
      };
    });
  };

  const toggleQuestionEnabled = (id: string) => {
    if (!settings) return;
    
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        custom_questions: prev.custom_questions.map(q => 
          q.id === id ? { ...q, enabled: !q.enabled } : q
        )
      };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to customize your AI persona
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Persona Questions</CardTitle>
        <CardDescription>
          These are the questions your AI persona asks startups during conversations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default questions section */}
        <div>
          <h3 className="font-medium mb-2">Default Questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These standard questions are always available to your AI persona
          </p>
          <div className="space-y-2 pl-4 border-l-2 border-border">
            {defaultQuestions.map((question, index) => (
              <div key={index} className="py-2 px-3 bg-secondary/30 rounded-md">
                <p className="text-sm">{question}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom questions section */}
        <div>
          <h3 className="font-medium mb-2">Custom Questions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your own questions for the AI persona to ask during conversations
          </p>
          
          {settings?.custom_questions && settings.custom_questions.length > 0 ? (
            <div className="space-y-2 pl-4 border-l-2 border-border mb-6">
              {settings.custom_questions.map((customQ) => (
                <div 
                  key={customQ.id} 
                  className={`py-2 px-3 rounded-md flex items-start justify-between gap-2 ${
                    customQ.enabled ? 'bg-secondary/30' : 'bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <p className="text-sm flex-1">{customQ.question}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch 
                      checked={customQ.enabled} 
                      onCheckedChange={() => toggleQuestionEnabled(customQ.id)}
                      aria-label="Enable question"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeQuestion(customQ.id)}
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground mb-6">
              No custom questions added yet
            </p>
          )}

          {/* Add new question form */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="E.g., What's your customer acquisition strategy?"
              className="flex-1"
            />
            <Button 
              onClick={addQuestion} 
              size="icon"
              disabled={!newQuestion.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveSettings} 
          disabled={saving} 
          className="ml-auto"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className={`h-4 w-4 ${saving ? '' : 'mr-2'}`} />
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};
