import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, X, Save, Edit, Trash2 } from "lucide-react";
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AIPersonaErrorHandler } from "./AIPersonaErrorHandler";
import { safeQueryResult } from "@/lib/supabase-helpers";

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

const questionFormSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters long")
});

export const AIPersonaSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [error, setError] = useState<Error | null>(null);
  
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: ""
    }
  });

  const defaultQuestions = [
    "Tell me about your business model?",
    "What traction do you have so far?",
    "Who are your competitors and how do you differentiate?",
    "What's your go-to-market strategy?",
    "Tell me about your team background?"
  ];

  useEffect(() => {
    if (user) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await supabase
        .from('investor_ai_persona_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      const data = safeQueryResult(response);
      
      if (data) {
        console.log("Loaded AI persona settings:", data);
        setSettings(data);
        if (data.system_prompt) {
          setSystemPrompt(data.system_prompt);
        }
      } else if (user) {
        console.log("No existing settings found, initializing with empty");
        setSettings({
          user_id: user?.id || "",
          custom_questions: []
        });
      }
    } catch (error) {
      console.error("Error fetching AI persona settings:", error);
      setError(error as Error);
      toast({
        title: "Error",
        description: "Failed to load AI persona settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user || !settings) return;
    
    setSaving(true);
    
    try {
      const customQuestionsWithIds = settings.custom_questions.map(q => ({
        ...q,
        id: q.id || crypto.randomUUID()
      }));
      
      const dataToSave = {
        user_id: user.id,
        custom_questions: customQuestionsWithIds,
        system_prompt: systemPrompt || null,
        updated_at: new Date().toISOString()
      };
      
      console.log("Saving AI persona settings:", dataToSave);
      
      if (settings.id) {
        const { error } = await supabase
          .from('investor_ai_persona_settings')
          .update(dataToSave)
          .eq('id', settings.id);
          
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('investor_ai_persona_settings')
          .insert(dataToSave)
          .select('id')
          .single();
          
        if (error) throw error;
        
        setSettings(prev => prev ? { ...prev, id: data.id, custom_questions: customQuestionsWithIds } : null);
      }
      
      toast({
        title: "Success",
        description: "AI Persona settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving AI persona settings:", error);
      toast({
        title: "Error",
        description: "Failed to save AI persona settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = (data: z.infer<typeof questionFormSchema>) => {
    if (!settings) return;
    
    const newQuestion: CustomQuestion = {
      id: crypto.randomUUID(),
      question: data.question,
      enabled: true
    };
    
    setSettings(prev => {
      if (!prev) return null;
      return {
        ...prev,
        custom_questions: [...prev.custom_questions, newQuestion]
      };
    });
    
    questionForm.reset();
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
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !settings) {
    return <AIPersonaErrorHandler />;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Persona Questions</CardTitle>
          <CardDescription>
            These are the questions your AI persona asks startups during conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(addQuestion)} className="space-y-4">
                <FormField
                  control={questionForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add a new question</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Textarea 
                            placeholder="E.g., What's your customer acquisition strategy?"
                            {...field}
                            className="resize-none"
                          />
                        </FormControl>
                        <Button type="submit" size="icon" className="shrink-0" disabled={questionForm.formState.isSubmitting}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">AI Persona Behavior</h3>
              {!editingPrompt ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingPrompt(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setEditingPrompt(false);
                    setSystemPrompt(settings?.system_prompt || "");
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Customize how your AI persona behaves during conversations
            </p>
            
            {editingPrompt ? (
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="E.g., Act like an experienced angel investor focused on SaaS startups. Be friendly but direct."
                className="w-full h-32 resize-none"
              />
            ) : (
              <div className="p-3 border rounded-md bg-muted/20">
                <p className="text-sm">
                  {systemPrompt ? systemPrompt : (
                    <span className="italic text-muted-foreground">
                      No custom behavior set. The AI will use default investor behavior.
                    </span>
                  )}
                </p>
              </div>
            )}
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
    </div>
  );
};
