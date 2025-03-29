
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
          const { data, error } = await supabase.functions.invoke('enable-realtime');
          
          if (error) {
            console.error("Failed to enable realtime:", error);
            toast({
              title: "Realtime Update Issue",
              description: "There was a problem enabling instant message updates",
              variant: "destructive",
            });
          } else {
            console.log("Realtime enabled successfully:", data);
          }
        } catch (error) {
          console.error("Error initializing realtime:", error);
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
