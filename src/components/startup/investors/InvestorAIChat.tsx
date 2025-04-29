import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Sparkle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSupabaseClient } from "@/lib/supabase-client-helper";

interface InvestorAIChatProps {
  investorId: string;
  investorName: string;
  onBack: () => void;
  onComplete?: (matchScore: number, matchSummary: string) => void;
}

interface Message {
  id: string;
  sender_type: "startup" | "ai";
  content: string;
  timestamp: string;
}

export const InvestorAIChat = ({ investorId, investorName, onBack, onComplete }: InvestorAIChatProps) => {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatCompleted, setChatCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedChatId = useRef<string | null>(null);
  
  // Track conversation progress
  const [conversationProgress, setConversationProgress] = useState<{
    customQuestionsAsked: number;
    totalCustomQuestions: number;
    topicsCovered: string[];
    topicsRemaining: string[];
    allTopicsCovered: boolean;
  }>({
    customQuestionsAsked: 0,
    totalCustomQuestions: 0,
    topicsCovered: [],
    topicsRemaining: [],
    allTopicsCovered: false
  });
  
  useEffect(() => {
    const fetchExistingChat = async () => {
      if (!user || !investorId) return;
      
      try {
        setIsLoading(true);
        
        const { data: existingChat, error: chatError } = await supabase
          .from('ai_persona_chats')
          .select('id, match_score, summary, completed')
          .eq('startup_id', user.id)
          .eq('investor_id', investorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (chatError && chatError.code !== 'PGRST116') {
          console.error("Error fetching existing chat:", chatError);
          toast({
            title: "Error",
            description: "Failed to load previous conversation",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (existingChat) {
          console.log("Found existing chat:", existingChat.id);
          setChatId(existingChat.id);
          savedChatId.current = existingChat.id;
          setChatCompleted(existingChat.completed || false);
          
          if (existingChat.completed && existingChat.match_score !== null && onComplete && user.id === investorId) {
            onComplete(existingChat.match_score, existingChat.summary || "");
          }
          
          const { data: chatMessages, error: messagesError } = await supabase
            .from('ai_persona_messages')
            .select('id, sender_type, content, created_at')
            .eq('chat_id', existingChat.id)
            .order('created_at', { ascending: true });
            
          if (messagesError) {
            console.error("Error fetching chat messages:", messagesError);
            toast({
              title: "Error",
              description: "Failed to load previous messages",
              variant: "destructive",
            });
          } else if (chatMessages && chatMessages.length > 0) {
            console.log(`Loaded ${chatMessages.length} previous messages`);
            
            const formattedMessages: Message[] = chatMessages.map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type as "startup" | "ai",
              content: msg.content,
              timestamp: msg.created_at
            }));
            
            setMessages(formattedMessages);
            
            // If last message was from AI and chat is marked completed, double-check
            if (formattedMessages.length > 0 && 
                formattedMessages[formattedMessages.length - 1].sender_type === "ai" &&
                existingChat.completed) {
              // Check if this appears to be a question (ends with ?)
              const lastMsg = formattedMessages[formattedMessages.length - 1].content;
              if (lastMsg.trim().endsWith('?')) {
                console.log("Last message is from AI and contains a question, chat should not be completed");
                await supabase
                  .from('ai_persona_chats')
                  .update({ completed: false })
                  .eq('id', existingChat.id);
                
                setChatCompleted(false);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchExistingChat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingChat();
  }, [user, investorId, onComplete]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Efficiently prepare persona settings
  const preparePersonaSettings = useCallback(async (investorId: string) => {
    console.log(`Fetching persona settings for investor ${investorId}`);
    
    // Fetch the full settings
    const { data: personaSettings, error: settingsError } = await supabase
      .from('investor_ai_persona_settings')
      .select('*')
      .eq('user_id', investorId)
      .maybeSingle();
      
    if (settingsError) {
      console.error("Error fetching persona settings:", settingsError.message);
      return null;
    } 
    
    // Check if we found persona settings
    if (!personaSettings) {
      console.log(`No persona settings found for investor ${investorId}`);
      return null;
    }
    
    console.log("Found persona settings with ID:", personaSettings.id);
    console.log("Custom questions count:", personaSettings?.custom_questions?.length || 0);
    
    // Create a deep clone to avoid modifying the original
    const settingsCopy = JSON.parse(JSON.stringify(personaSettings));
    
    // Process custom questions - ensure they are properly formatted
    if (settingsCopy.custom_questions) {
      if (!Array.isArray(settingsCopy.custom_questions)) {
        console.warn("Custom questions is not an array, fixing");
        settingsCopy.custom_questions = [];
      } else {
        // Ensure we only keep valid questions with the correct format
        const validQuestions = settingsCopy.custom_questions
          .filter(q => (
            q && 
            typeof q === 'object' && 
            typeof q.question === 'string' && 
            q.question.trim().length > 0 &&
            q.enabled !== false // Only keep enabled questions
          ))
          .map(q => ({
            id: q.id || crypto.randomUUID(),
            question: q.question.trim(),
            enabled: true // Force to true since we already filtered out disabled ones
          }));
        
        settingsCopy.custom_questions = validQuestions;
        
        if (validQuestions.length > 0) {
          console.log(`Found ${validQuestions.length} valid custom questions`);
        }
      }
    }
    
    return settingsCopy;
  }, []);
  
  const sendMessage = async (messageText: string) => {
    if (!user || !investorId || !messageText.trim() || isSending) {
      return;
    }
    
    try {
      setIsSending(true);
      
      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender_type: "startup",
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage("");
      
      // Fetch data in parallel for better performance
      const [startupData, investorPref, personaSettings] = await Promise.all([
        supabase.from('startup_profiles').select('*').eq('id', user.id).single().then(res => res.data),
        supabase.from('investor_preferences').select('*').eq('user_id', investorId).maybeSingle().then(res => res.data),
        preparePersonaSettings(investorId)
      ]);
      
      // Handle chat ID management
      let currentChatId = chatId;
      if (!currentChatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('ai_persona_chats')
          .insert({
            investor_id: investorId,
            startup_id: user.id,
          })
          .select('id')
          .single();
          
        if (chatError) {
          console.error("Error creating chat:", chatError);
          throw new Error("Failed to create chat session");
        }
        
        currentChatId = newChat.id;
        setChatId(currentChatId);
        savedChatId.current = currentChatId;
      }
      
      // Save user message to database
      await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: currentChatId,
          sender_type: "startup",
          content: messageText,
        });
      
      // Call the edge function
      const functionUrl = "https://vsxnjnvwtgehagxbhdzh.supabase.co/functions/v1/investor-ai-persona";
      
      // Prepare the payload
      const payload = {
        message: messageText,
        chatHistory: messages,
        investorId: investorId,
        startupId: user.id,
        investorPreferences: investorPref,
        investorName: investorName,
        startupInfo: startupData,
        chatId: currentChatId,
        personaSettings: personaSettings
      };
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeG5qbnZ3dGdlaGFneGJoZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODkzOTQsImV4cCI6MjA1ODE2NTM5NH0.4SEISsoUanD3lFIswUzBFo4ll3qC2Yd6mlN8rVwuyFo`,
        },
        body: JSON.stringify(payload),
      });
      
      // Process the response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI persona response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received AI response:', data);
      
      // Update conversation progress tracking
      setConversationProgress({
        customQuestionsAsked: data.customQuestionsAsked || 0,
        totalCustomQuestions: data.totalCustomQuestions || 0,
        topicsCovered: data.topicsCovered || [],
        topicsRemaining: data.topicsRemaining || [],
        allTopicsCovered: data.allTopicsCovered || false
      });
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        sender_type: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save AI response to database
      await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: currentChatId,
          sender_type: "ai",
          content: data.response,
        });
      
      // Check if chat is complete (has match score)
      if (data.matchScore !== null && data.matchSummary) {
        console.log("Match score generated, marking chat as complete");
        await supabase
          .from('ai_persona_chats')
          .update({
            match_score: data.matchScore,
            summary: data.matchSummary,
            completed: true
          })
          .eq('id', currentChatId);
          
        setChatCompleted(true);
        
        if (onComplete && user.id === investorId) {
          onComplete(data.matchScore, data.matchSummary);
        }
      } else if (data.allTopicsCovered) {
        console.log("All topics covered but no match score yet");
      }
      
      // Scroll to bottom of chat
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Error in sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-1">
              {investorName} <Sparkle size={14} className="text-purple-500" />
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>AI-powered conversation</span>
              <Badge variant="outline" className="text-xs bg-purple-100/50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50">
                OpenAI GPT
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Loading conversation...</span>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === "startup" ? "justify-end" : "justify-start"} mb-3`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                    msg.sender_type === "startup" 
                      ? "bg-accent text-accent-foreground rounded-br-none" 
                      : "bg-muted rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8 space-y-4">
                <p>Start the conversation by introducing your startup.</p>
                <div className="text-xs bg-accent/5 p-4 rounded-md mx-auto max-w-md border border-border">
                  <p className="font-medium mb-2">How this conversation works:</p>
                  <ul className="text-left list-disc pl-4 space-y-1">
                    <li>This is a natural AI conversation with {investorName}'s AI persona</li>
                    <li>The AI will ask you questions to understand your startup</li>
                    {conversationProgress.totalCustomQuestions > 0 && (
                      <li>
                        This investor has <strong className="text-primary">{conversationProgress.totalCustomQuestions} custom questions</strong> they'd like to discuss
                      </li>
                    )}
                    <li>After the conversation, you'll get an investor match score</li>
                  </ul>
                </div>
              </div>
            )}
            
            {chatCompleted && !isLoading && user?.id !== investorId && (
              <div className="mt-6 p-4 border border-accent/20 bg-accent/10 rounded-lg text-center">
                <p className="font-medium">This chat is complete. The investor will be notified of this potential match.</p>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await sendMessage(currentMessage);
          }}
          className="flex items-center"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-1 mr-2"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            disabled={isLoading || isSending || chatCompleted}
          />
          <Button type="submit" disabled={isLoading || isSending || !currentMessage.trim() || chatCompleted}>
            {isSending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
