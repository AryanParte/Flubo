
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/investor/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { initializeRealtime, checkRealtimeStatus } from "@/services/message-service";
import { toast } from "@/components/ui/use-toast";

const InvestorMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [realtimeInitialized, setRealtimeInitialized] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated and auth check is complete
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading) {
      setLoading(false);
      
      // Initialize realtime when we load the messages page
      if (user && !realtimeInitialized) {
        console.log("Investor user loaded:", user.id);
        setRealtimeInitialized(true);
        
        // Check the current realtime status
        checkRealtimeStatus()
          .then(status => {
            console.log("Current realtime status:", status);
          })
          .catch(err => {
            console.error("Error checking realtime status:", err);
          });
        
        // Initialize realtime functionality
        initializeRealtime()
          .then(result => {
            console.log("Realtime initialization completed:", result);
            if (result.success) {
              toast({
                title: "Realtime Messaging Enabled",
                description: "You'll now receive messages in real-time without page reloads",
              });
            } else {
              console.error("Realtime initialization failed:", result.error);
            }
          })
          .catch(err => {
            console.error("Error during realtime initialization:", err);
          });
      }
    }
  }, [user, authLoading, navigate, realtimeInitialized]);

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
