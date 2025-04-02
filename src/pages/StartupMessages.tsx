
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/startup/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const StartupMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading) {
      setLoading(false);
      
      // Initialize realtime when we load the messages page
      const initializeRealtime = async () => {
        try {
          console.log("Initializing realtime for startup messages");
          
          // Call the database function to enable realtime with proper typing
          const { data: replicaResult, error: replicaError } = await (supabase
            .rpc('set_messages_replica_identity', {}, { count: 'exact' }) as unknown as Promise<{data: any, error: any}>);
            
          if (replicaError) {
            console.log("Note: Error setting replica identity:", replicaError);
          }
          
          const { data: enableResult, error: enableError } = await (supabase
            .rpc('enable_realtime_for_messages', {}, { count: 'exact' }) as unknown as Promise<{data: any, error: any}>);
            
          if (enableError) {
            console.log("Note: Error enabling realtime:", enableError);
          }
          
          // Attempt to enable realtime via the Edge Function as a backup
          supabase.functions.invoke('enable-realtime')
            .then(({ data, error }) => {
              if (error) {
                console.log("Note: Edge Function for realtime returned an error, but messages should still work:", error);
                // Don't show toast to user as it's not critical and might be confusing
              } else {
                console.log("Realtime initialization response:", data);
              }
            })
            .catch(err => {
              console.log("Error calling realtime function (continuing anyway):", err);
            });
          
        } catch (error) {
          console.error("Error in initializeRealtime function:", error);
          // Continue despite errors - realtime should still work through client channels
        }
      };
      
      initializeRealtime();
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
          <h1 className="text-2xl font-bold mb-8">Messages</h1>
          <MessagesTab />
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default StartupMessages;
