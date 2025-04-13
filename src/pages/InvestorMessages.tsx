
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/investor/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { deleteAIPersonaChatHistory } from "@/services/message-service";

const InvestorMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isResettingAllChats, setIsResettingAllChats] = useState(false);

  const resetAllAIChats = async () => {
    if (!user || isResettingAllChats) return;
    
    try {
      setIsResettingAllChats(true);
      
      // Find all AI persona chats with this investor
      const { data: chats, error: chatsError } = await supabase
        .from('ai_persona_chats')
        .select('id, startup_id')
        .eq('investor_id', user.id);
        
      if (chatsError) {
        console.error("Error finding AI persona chats:", chatsError);
        throw chatsError;
      }
      
      if (!chats || chats.length === 0) {
        toast({
          title: "No AI chats",
          description: "There are no AI persona chats to reset.",
        });
        return;
      }
      
      const chatIds = chats.map(chat => chat.id);
      
      // Delete all messages for these chats
      const { error: messagesDeleteError } = await supabase
        .from('ai_persona_messages')
        .delete()
        .in('chat_id', chatIds);
        
      if (messagesDeleteError) {
        console.error("Error deleting AI persona messages:", messagesDeleteError);
        throw messagesDeleteError;
      }
      
      // Delete the chat records
      const { error: chatsDeleteError } = await supabase
        .from('ai_persona_chats')
        .delete()
        .in('id', chatIds);
        
      if (chatsDeleteError) {
        console.error("Error deleting AI persona chats:", chatsDeleteError);
        throw chatsDeleteError;
      }
      
      toast({
        title: "Success",
        description: `Reset ${chats.length} AI persona chat(s)`,
      });
    } catch (error) {
      console.error("Error resetting AI chats:", error);
      toast({
        title: "Error",
        description: "Failed to reset AI chats",
        variant: "destructive",
      });
    } finally {
      setIsResettingAllChats(false);
    }
  };

  useEffect(() => {
    // Redirect if not authenticated and auth check is complete
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading) {
      setLoading(false);
      
      // Log user details for debugging
      if (user) {
        console.log("Investor user loaded:", user.id);
        
        // Initialize realtime for messages
        const initializeRealtime = async () => {
          try {
            console.log("Initializing realtime for investor messages");
            
            // Use 'as any' to bypass TypeScript's function name validation
            const { error: replicaError } = await ((supabase.rpc as any)(
              'set_messages_replica_identity', 
              {}, 
              { count: 'exact' }
            ));
              
            if (replicaError) {
              console.log("Note: Error setting replica identity:", replicaError);
            }
            
            const { error: enableError } = await ((supabase.rpc as any)(
              'enable_realtime_for_messages', 
              {}, 
              { count: 'exact' }
            ));
              
            if (enableError) {
              console.log("Note: Error enabling realtime:", enableError);
            }
            
            // Attempt to enable realtime via the Edge Function as a backup
            supabase.functions.invoke('enable-realtime')
              .then(({ data, error }) => {
                if (error) {
                  console.log("Note: Edge Function for realtime returned an error, but messages should still work:", error);
                } else {
                  console.log("Realtime initialization response:", data);
                }
              })
              .catch(err => {
                console.log("Error calling realtime function (continuing anyway):", err);
              });
            
          } catch (error) {
            console.error("Error in initializeRealtime function:", error);
          }
        };
        
        initializeRealtime();
      }
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </main>
        <MinimalFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Messages</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllAIChats}
              disabled={isResettingAllChats}
            >
              {isResettingAllChats ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset All AI Chats"
              )}
            </Button>
          </div>
          <MessagesTab />
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default InvestorMessages;
