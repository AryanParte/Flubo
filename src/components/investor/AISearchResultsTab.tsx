
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
  MessageSquare,
  Loader2,
  ExternalLink,
  Globe
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
  websiteUrl?: string;
  demoUrl?: string;
};

interface AISearchResultsTabProps {
  results: StartupResult[] | null;
}

export const AISearchResultsTab = ({ results }: AISearchResultsTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [interestedIn, setInterestedIn] = useState<string[]>([]);

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
      
      // Navigate to messages page
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

  const handleExpressInterest = (startup: StartupResult) => {
    if (interestedIn.includes(startup.name)) {
      // Already interested, remove interest
      setInterestedIn(interestedIn.filter(name => name !== startup.name));
      toast({
        title: "Interest removed",
        description: `You've removed your interest in ${startup.name}`
      });
    } else {
      // Add interest
      setInterestedIn([...interestedIn, startup.name]);
      toast({
        title: "Interest expressed",
        description: `You've expressed interest in ${startup.name}`
      });
    }
  };

  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      window.open(url, '_blank');
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
      <h2 className="text-xl font-semibold">Search Results</h2>
      <p className="text-muted-foreground">
        These startups match your search criteria. Results are a mix of real startups in our platform and potential matches.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((startup, index) => (
          <div 
            key={index}
            className="rounded-lg overflow-hidden flex flex-col glossy-card animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="glossy-highlight" />
            <div className="h-32 bg-gradient-to-r from-accent/30 to-accent/10 flex items-center justify-center">
              <span className="font-medium text-2xl">{startup.name.charAt(0)}</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">{startup.name}</h3>
                <div className="flex items-center space-x-1 px-2 py-1 bg-accent/20 backdrop-blur-sm rounded text-accent text-sm">
                  <Sparkles size={14} />
                  <span>{startup.matchScore}% Match</span>
                </div>
              </div>
              
              <div className="mb-4 text-sm">
                <p className="text-muted-foreground italic">{startup.tagline}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
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
              
              <p className="mb-4 text-sm">{startup.description}</p>
              
              {/* External Links */}
              {(startup.websiteUrl || startup.demoUrl) && (
                <div className="flex space-x-2 mb-4">
                  {startup.demoUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center backdrop-blur-sm"
                      onClick={(e) => handleOpenLink(startup.demoUrl!, e)}
                    >
                      <ExternalLink size={14} className="mr-1" />
                      Demo
                    </Button>
                  )}
                  {startup.websiteUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center backdrop-blur-sm"
                      onClick={(e) => handleOpenLink(startup.websiteUrl!, e)}
                    >
                      <Globe size={14} className="mr-1" />
                      Website
                    </Button>
                  )}
                </div>
              )}
              
              <div className="mt-auto flex space-x-3">
                <Button 
                  variant="accent" 
                  size="sm" 
                  className="flex-1 backdrop-blur-sm"
                  onClick={() => handleConnectClick(startup)}
                  disabled={connecting === startup.name}
                >
                  {connecting === startup.name ? (
                    <>
                      <Loader2 size={14} className="mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} className="mr-1" />
                      Connect
                    </>
                  )}
                </Button>
                <Button 
                  variant={interestedIn.includes(startup.name) ? "default" : "outline"}
                  size="sm"
                  className="flex-1 backdrop-blur-sm"
                  onClick={() => handleExpressInterest(startup)}
                >
                  <ThumbsUp size={14} className="mr-1" />
                  {interestedIn.includes(startup.name) ? "Interested" : "Express Interest"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
