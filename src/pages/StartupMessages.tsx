import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { MessagesTab } from "@/components/startup/MessagesTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const StartupMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading) {
      setLoading(false);
      
      if (user) {
        console.log("Startup user loaded:", user.id);
        
        const checkUserProfile = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error checking user profile:", error);
          } else {
            console.log("User profile found:", data);
            
            const checkMessages = async () => {
              const { data: messages, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
              
              if (msgError) {
                console.error("Error checking messages:", msgError);
              } else {
                console.log("Messages for startup user:", messages?.length || 0);
                if (messages?.length > 0) {
                  console.log("Sample message:", messages[0]);
                }
              }
            };
            
            checkMessages();
          }
        };
        
        checkUserProfile();
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

export default StartupMessages;
