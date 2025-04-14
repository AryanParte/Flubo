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

      const functionUrl = supabase.auth.url + '/functions/v1/investor-ai-persona';
      console.log('Calling edge function at URL:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.anon_key}`,
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
          />
          <Button type="submit" disabled={isSending || !currentMessage.trim()}>
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
