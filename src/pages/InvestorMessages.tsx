
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/investor/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { clearAIPersonaChats } from "@/services/ai-persona-service";

const InvestorMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [resettingChats, setResettingChats] = useState(false);

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

  const handleResetAIChats = async () => {
    setResettingChats(true);
    try {
      const { success, error } = await clearAIPersonaChats();
      
      if (success) {
        toast({
          title: "AI Chat History Cleared",
          description: "All AI persona conversations have been reset successfully.",
        });
      } else {
        console.error("Failed to clear AI chats:", error);
        toast({
          title: "Error",
          description: "Failed to clear AI chat history. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting AI chats:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while resetting AI chats.",
        variant: "destructive",
      });
    } finally {
      setResettingChats(false);
    }
  };

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
              onClick={handleResetAIChats}
              disabled={resettingChats}
              className="flex items-center gap-2"
            >
              {resettingChats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Reset AI Chats
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
