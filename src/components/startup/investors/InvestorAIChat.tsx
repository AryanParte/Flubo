
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Investor } from "@/types/investor";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, X } from "lucide-react";

interface InvestorAIChatProps {
  investor: Investor;
}

export const InvestorAIChat = ({ investor }: InvestorAIChatProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{id: string, sender_type: string, content: string}>>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [startupInfo, setStartupInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatCompleted, setIsChatCompleted] = useState(false);
  const [completingChat, setCompletingChat] = useState(false);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);
  
  // Initialize chat when dialog opens
  useEffect(() => {
    if (open && user) {
      initializeChat();
    }
  }, [open, user, investor.id]);
  
  const initializeChat = async () => {
    if (!user) return;
    
    try {
      setInitializing(true);
      
      // First, check if a chat already exists between this startup and investor
      const { data: existingChat, error: chatError } = await supabase
        .from('ai_persona_chats')
        .select('*')
        .eq('startup_id', user.id)
        .eq('investor_id', investor.id)
        .maybeSingle();
      
      if (chatError) throw chatError;
      
      // Fetch startup profile information to provide context to the AI
      const { data: startupProfile, error: profileError } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      if (startupProfile) {
        setStartupInfo(startupProfile);
      }
      
      if (existingChat) {
        console.log("Found existing chat:", existingChat);
        setChatId(existingChat.id);
        setIsChatCompleted(existingChat.completed || false);
        
        // Get chat history
        const { data: messages, error: messagesError } = await supabase
          .from('ai_persona_messages')
          .select('*')
          .eq('chat_id', existingChat.id)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        if (messages && messages.length > 0) {
          setChatHistory(messages);
        } else {
          // Add welcome message
          await sendWelcomeMessage(existingChat.id);
        }
      } else {
        // Create new chat
        const { data: newChat, error: createError } = await supabase
          .from('ai_persona_chats')
          .insert({
            startup_id: user.id,
            investor_id: investor.id,
            completed: false
          })
          .select()
          .single();
          
        if (createError) throw createError;
        
        console.log("Created new chat:", newChat);
        setChatId(newChat.id);
        
        // Add welcome message
        await sendWelcomeMessage(newChat.id);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast({
        title: "Error",
        description: "Failed to start AI chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setInitializing(false);
    }
  };
  
  const sendWelcomeMessage = async (chatId: string) => {
    if (!chatId) return;
    
    try {
      // First record the system welcome message in the database
      const welcomeMessage = "Hi there! I'm interested in learning more about your startup. Could you tell me about what you're building and what problem you're solving?";
      
      const { data: msgData, error: msgError } = await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: chatId,
          content: welcomeMessage,
          sender_type: 'ai'
        })
        .select()
        .single();
        
      if (msgError) throw msgError;
      
      // Update the chat history
      setChatHistory([{
        id: msgData.id,
        content: welcomeMessage,
        sender_type: 'ai'
      }]);
      
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  };
  
  const handleSendMessage = async () => {
    if (!message.trim() || !chatId || !user) return;
    
    try {
      setLoading(true);
      
      // Store the user's message in the database
      const { data: msgData, error: msgError } = await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: chatId,
          content: message,
          sender_type: 'startup'
        })
        .select()
        .single();
        
      if (msgError) throw msgError;
      
      // Update local chat history
      const updatedHistory = [...chatHistory, {
        id: msgData.id,
        sender_type: 'startup',
        content: message
      }];
      
      setChatHistory(updatedHistory);
      setMessage("");
      
      // Call the edge function to get the AI response
      const response = await supabase.functions.invoke('investor-ai-persona', {
        body: {
          message: message,
          chatHistory: updatedHistory,
          investorId: investor.id,
          startupId: user.id,
          investorPreferences: {
            preferred_sectors: investor.preferred_sectors,
            preferred_stages: investor.preferred_stages,
            min_investment: investor.min_investment,
            max_investment: investor.max_investment
          },
          investorName: investor.name,
          startupInfo: startupInfo,
          chatId: chatId
        }
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const { response: aiResponse, matchScore, matchSummary } = response.data;
      
      // Store the AI response in the database
      const { data: aiMsgData, error: aiMsgError } = await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: chatId,
          content: aiResponse,
          sender_type: 'ai'
        })
        .select()
        .single();
        
      if (aiMsgError) throw aiMsgError;
      
      // Update local chat history
      setChatHistory([...updatedHistory, {
        id: aiMsgData.id,
        sender_type: 'ai',
        content: aiResponse
      }]);
      
      // Update the chat with match score and summary if provided
      if (matchScore !== null && matchSummary) {
        console.log("Updating chat with match score:", matchScore);
        
        const { error: updateError } = await supabase
          .from('ai_persona_chats')
          .update({
            match_score: matchScore,
            summary: matchSummary
          })
          .eq('id', chatId);
          
        if (updateError) throw updateError;
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const completeChat = async () => {
    if (!chatId || !user) return;
    
    try {
      setCompletingChat(true);
      
      // Mark the chat as completed
      const { error: updateError } = await supabase
        .from('ai_persona_chats')
        .update({
          completed: true
        })
        .eq('id', chatId);
        
      if (updateError) throw updateError;
      
      setIsChatCompleted(true);
      
      toast({
        title: "Chat Completed",
        description: "Your conversation has been recorded and the investor will be notified of a potential match.",
      });
      
    } catch (error) {
      console.error("Error completing chat:", error);
      toast({
        title: "Error",
        description: "Failed to complete the chat. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingChat(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="outline" 
        size="sm"
        className="flex items-center space-x-1"
      >
        <Bot size={14} className="mr-1" />
        Try AI Chat
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with {investor.name}'s AI Persona</DialogTitle>
            <DialogDescription>
              This is a simulated conversation with {investor.name} powered by AI.
              {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
                <span className="block mt-1 text-xs">
                  Focuses on: {investor.preferred_sectors.join(', ')}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {initializing ? (
            <div className="py-10 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Connecting to AI persona...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 max-h-[300px]">
                {chatHistory.map((msg, index) => (
                  <div 
                    key={msg.id || index} 
                    className={`flex ${msg.sender_type === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.sender_type === 'ai' 
                          ? 'bg-secondary text-secondary-foreground rounded-tl-none' 
                          : 'bg-accent text-accent-foreground rounded-tr-none'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <DialogFooter className="flex-col sm:flex-col gap-2">
                {isChatCompleted ? (
                  <div className="w-full text-center p-2 bg-secondary/30 rounded-md">
                    <p className="text-sm">This chat is complete. The investor will be notified of this potential match.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex w-full items-end gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 resize-none"
                        disabled={loading || completingChat}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || loading || completingChat}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {chatHistory.length >= 6 && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={completeChat}
                        disabled={completingChat}
                      >
                        {completingChat ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Finalizing Chat...
                          </>
                        ) : (
                          "End Chat & Submit to Investor"
                        )}
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
