
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/investor/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const InvestorMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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
            
            // Call the database function to enable realtime using type assertion
            const { error: replicaError } = await (supabase
              .rpc('set_messages_replica_identity', {}, { count: 'exact' }) as Promise<{data: any, error: any}>);
              
            if (replicaError) {
              console.log("Note: Error setting replica identity:", replicaError);
            }
            
            const { error: enableError } = await (supabase
              .rpc('enable_realtime_for_messages', {}, { count: 'exact' }) as Promise<{data: any, error: any}>);
              
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
          <h1 className="text-2xl font-bold mb-8">Messages</h1>
          <MessagesTab />
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default InvestorMessages;
