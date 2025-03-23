
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building, 
  MapPin, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Sparkles,
  ThumbsUp,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type StartupResult = {
  name: string;
  tagline: string;
  industry: string;
  stage: string;
  location: string;
  foundedYear: number | string;
  funding: string;
  matchScore: number;
  description: string;
};

interface AISearchResultsTabProps {
  results: StartupResult[] | null;
}

export const AISearchResultsTab = ({ results }: AISearchResultsTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnectClick = async (startup: StartupResult) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to connect with startups",
      });
      return;
    }

    try {
      setConnecting(startup.name);
      
      // Create a fake profile ID for the startup (for demo purposes)
      const fakeStartupId = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Send a message to this startup (though it's a mock startup)
      const { error } = await supabase
        .from('messages')
        .insert({
          content: `Hello ${startup.name}! I'm interested in learning more about your company.`,
          sender_id: user.id,
          recipient_id: fakeStartupId,
          sent_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Request sent",
        description: `Your interest has been registered with ${startup.name}`,
      });
      
      // For demo purposes, we could navigate to messages
      navigate('/investor/messages');
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: error.message || "Failed to connect with the startup",
      });
    } finally {
      setConnecting(null);
    }
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-medium">No results found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Try modifying your search query to get better results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">AI-Powered Search Results</h2>
      <p className="text-muted-foreground">
        These startups match your search criteria. Results are generated by AI and may not represent actual companies.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((startup, index) => (
          <div 
            key={index}
            className="p-6 border border-border/60 rounded-lg bg-background/40 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{startup.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{startup.tagline}</p>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-accent/10 rounded text-accent text-sm">
                <Sparkles size={14} />
                <span>{startup.matchScore}% Match</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Building size={14} />
                <span>{startup.industry}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <BarChart3 size={14} />
                <span>{startup.stage}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <MapPin size={14} />
                <span>{startup.location}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar size={14} />
                <span>Founded {startup.foundedYear}</span>
              </div>
              
              <div className="col-span-2 flex items-center space-x-1 text-muted-foreground">
                <DollarSign size={14} />
                <span>Raised {startup.funding}</span>
              </div>
            </div>
            
            <p className="mt-4 text-sm">{startup.description}</p>
            
            <div className="mt-6 flex space-x-3">
              <Button 
                variant="accent" 
                size="sm" 
                className="flex-1"
                onClick={() => handleConnectClick(startup)}
                disabled={connecting === startup.name}
              >
                {connecting === startup.name ? (
                  "Connecting..."
                ) : (
                  <>
                    <MessageSquare size={14} className="mr-1" />
                    Connect
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <ThumbsUp size={14} className="mr-1" />
                Express Interest
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
