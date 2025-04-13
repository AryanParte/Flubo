
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusCircle, Trash2, Save, Loader2 } from "lucide-react";
import { 
  Card, 
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter 
} from "@/components/ui/card";

type CustomQuestion = {
  id: string;
  question: string;
  enabled: boolean;
};

export const AIPersonaSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultQuestions, setDefaultQuestions] = useState([
    "Tell me about your business model?",
    "What traction do you have so far?",
    "Who are your competitors and how do you differentiate?",
    "What's your go-to-market strategy?",
    "Tell me about your team background?"
  ]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('investor_ai_persona_settings')
        .select('custom_questions, system_prompt')
        .eq('user_id', user?.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error loading AI persona settings:", error);
        toast({
          title: "Error",
          description: "Failed to load your AI persona settings",
          variant: "destructive"
        });
        return;
      }
      
      if (data) {
        if (data.custom_questions && Array.isArray(data.custom_questions)) {
          setCustomQuestions(data.custom_questions);
        }
        
        if (data.system_prompt) {
          setSystemPrompt(data.system_prompt);
        }
      }
    } catch (error) {
      console.error("Error in loadSettings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // Filter out empty questions
      const filteredQuestions = customQuestions.filter(q => q.question.trim() !== "");
      
      const { data, error } = await supabase
        .from('investor_ai_persona_settings')
        .upsert({
          user_id: user.id,
          custom_questions: filteredQuestions,
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error("Error saving AI persona settings:", error);
        toast({
          title: "Error",
          description: "Failed to save your AI persona settings",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Settings Saved",
        description: "Your AI persona settings have been updated"
      });
    } catch (error) {
      console.error("Error in saveSettings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addNewQuestion = () => {
    if (!newQuestion.trim()) return;
    
    setCustomQuestions([
      ...customQuestions,
      {
        id: crypto.randomUUID(),
        question: newQuestion.trim(),
        enabled: true
      }
    ]);
    
    setNewQuestion("");
  };

  const removeQuestion = (id: string) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, question: string) => {
    setCustomQuestions(customQuestions.map(q => 
      q.id === id ? { ...q, question } : q
    ));
  };

  const toggleQuestion = (id: string) => {
    setCustomQuestions(customQuestions.map(q => 
      q.id === id ? { ...q, enabled: !q.enabled } : q
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Persona Questions</CardTitle>
          <CardDescription>
            Customize the questions your AI persona will ask startups during simulated conversations
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
            <h3 className="font-medium mb-2">Your Custom Questions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your own questions to better evaluate startups
            </p>
            
            <div className="space-y-3 mb-4">
              {customQuestions.length > 0 ? (
                customQuestions.map((q) => (
                  <div key={q.id} className="flex items-start gap-2">
                    <Textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeQuestion(q.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-md">
                  <p className="text-muted-foreground">No custom questions added yet</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a custom question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={addNewQuestion}
                disabled={!newQuestion.trim()}
              >
                <PlusCircle size={16} className="mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="accent" 
            className="ml-auto"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
