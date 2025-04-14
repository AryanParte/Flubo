
import React, { useState, useRef, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedChatId = useRef<string | null>(null);
  
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
      
      // Add the user message to the chat
      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender_type: "startup",
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage("");
      
      // Get startup information
      const { data: startupData } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Get investor preferences
      const { data: investorPref } = await supabase
        .from('investor_preferences')
        .select('*')
        .eq('user_id', investorId)
        .single();
        
      // Get investor AI persona settings
      const { data: personaSettings } = await supabase
        .from('investor_ai_persona_settings')
        .select('custom_questions, system_prompt')
        .eq('user_id', investorId)
        .single();
      
      // Create or get chat session
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
        
        // Save the first message to the database
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: newChat.id,
            sender_type: "startup",
            content: messageText,
          });
      } else {
        // Save the message to the database
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: chatId,
            sender_type: "startup",
            content: messageText,
          });
      }
      
      // Call the Edge Function to get the AI response
      const functionUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/investor-ai-persona';
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
        const errorData = await response.json();
        console.error("AI persona error:", errorData);
        throw new Error(errorData.error || "Failed to get AI response");
      }
      
      const data = await response.json();
      
      // Add the AI response to the chat
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        sender_type: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save the AI response to the database
      if (chatId || savedChatId.current) {
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: chatId || savedChatId.current,
            sender_type: "ai",
            content: data.response,
          });
          
        // If we have a match score, update the chat
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
      
      // Scroll to bottom after a short delay to ensure the message is rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Error sending message:", error);
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
      <div className="p-4 border-b border-border">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border">
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
          />
          <Button type="submit" disabled={isSending}>
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
