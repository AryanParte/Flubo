
import React, { useState, useRef, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface InvestorAIChatProps {
  investorId: string;
  investorName: string;
  onBack: () => void;
  onComplete: (matchScore: number, matchSummary: string) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedChatId = useRef<string | null>(null);
  
  // Fetch existing chat and messages on component mount
  useEffect(() => {
    const fetchExistingChat = async () => {
      if (!user || !investorId) return;
      
      try {
        setIsLoading(true);
        
        // First, check if a chat already exists between this startup and investor
        const { data: existingChat, error: chatError } = await supabase
          .from('ai_persona_chats')
          .select('id, match_score, summary, completed')
          .eq('startup_id', user.id)
          .eq('investor_id', investorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (chatError && chatError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error fetching existing chat:", chatError);
          toast({
            title: "Error",
            description: "Failed to load previous conversation",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // If chat exists, fetch its messages
        if (existingChat) {
          console.log("Found existing chat:", existingChat.id);
          setChatId(existingChat.id);
          savedChatId.current = existingChat.id;
          
          // If the chat is marked as completed with a match score, notify parent
          if (existingChat.completed && existingChat.match_score !== null && onComplete) {
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
            
            // Transform the messages to match our local format
            const formattedMessages: Message[] = chatMessages.map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type as "startup" | "ai",
              content: msg.content,
              timestamp: msg.created_at
            }));
            
            setMessages(formattedMessages);
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
      
      const { data: startupData } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      const { data: investorPref } = await supabase
        .from('investor_preferences')
        .select('*')
        .eq('user_id', investorId)
        .single();
        
      const { data: personaSettings } = await supabase
        .from('investor_ai_persona_settings')
        .select('custom_questions, system_prompt')
        .eq('user_id', investorId)
        .single();
      
      if (!chatId) {
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
        
        setChatId(newChat.id);
        savedChatId.current = newChat.id;
        
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: newChat.id,
            sender_type: "startup",
            content: messageText,
          });
      } else {
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: chatId,
            sender_type: "startup",
            content: messageText,
          });
      }
      
      console.log('Sending message to investor AI persona', {
        investorId, 
        messageLength: messageText.length,
        chatHistoryLength: messages.length
      });

      // Use direct URL construction with the project ID instead of accessing protected properties
      const functionUrl = "https://vsxnjnvwtgehagxbhdzh.supabase.co/functions/v1/investor-ai-persona";
      console.log('Calling edge function at URL:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeG5qbnZ3dGdlaGFneGJoZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODkzOTQsImV4cCI6MjA1ODE2NTM5NH0.4SEISsoUanD3lFIswUzBFo4ll3qC2Yd6mlN8rVwuyFo`,
        },
        body: JSON.stringify({
          message: messageText,
          chatHistory: messages,
          investorId: investorId,
          startupId: user.id,
          investorPreferences: investorPref,
          investorName: investorName,
          startupInfo: startupData,
          chatId: chatId || savedChatId.current,
          personaSettings: personaSettings || null
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI persona response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
        console.log('Received AI response:', data);
      } catch (parseError) {
        console.error('JSON parsing error:', {
          error: parseError,
          responseText: await response.text()
        });
        throw new Error('Failed to parse API response');
      }
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        sender_type: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      if (chatId || savedChatId.current) {
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: chatId || savedChatId.current,
            sender_type: "ai",
            content: data.response,
          });
          
        if (data.matchScore !== null && typeof data.matchScore !== 'undefined') {
          await supabase
            .from('ai_persona_chats')
            .update({
              match_score: data.matchScore,
              summary: data.matchSummary,
              completed: true
            })
            .eq('id', chatId || savedChatId.current);
            
          if (onComplete) {
            onComplete(data.matchScore, data.matchSummary);
          }
        }
      }
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Detailed error in sending message:", error);
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
    <div className="flex flex-col h-[65vh]">
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
                className={`flex ${msg.sender_type === "startup" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === "startup" ? "bg-accent text-white rounded-br-none" : "bg-secondary rounded-bl-none"}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start the conversation by asking a question or introducing your startup.
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
            disabled={isLoading || isSending}
          />
          <Button type="submit" disabled={isLoading || isSending || !currentMessage.trim()}>
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
