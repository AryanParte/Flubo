
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
          <Card 
            key={index}
            className="flex flex-col h-full min-h-[450px] border border-border animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
              <span className="font-medium text-2xl">{startup.name.charAt(0)}</span>
            </div>
            
            <CardContent className="p-6 flex-grow flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold truncate max-w-[70%]">{startup.name}</h3>
                <div className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 rounded text-accent text-xs">
                  <Sparkles size={14} />
                  <span>{startup.matchScore}% Match</span>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-muted-foreground italic line-clamp-1">{startup.tagline}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building size={14} className="flex-shrink-0" />
                  <span className="truncate">{startup.industry}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <BarChart3 size={14} className="flex-shrink-0" />
                  <span className="truncate">{startup.stage}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{startup.location}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar size={14} className="flex-shrink-0" />
                  <span className="truncate">Founded {startup.foundedYear}</span>
                </div>
                
                <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign size={14} className="flex-shrink-0" />
                  <span className="truncate">Raised {startup.funding}</span>
                </div>
              </div>
              
              <p className="text-sm line-clamp-2 min-h-[2.5rem] mt-2">{startup.description}</p>
              
              {/* External Links */}
              {(startup.websiteUrl || startup.demoUrl) && (
                <div className="flex gap-2 mt-auto">
                  {startup.demoUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center h-8"
                      onClick={(e) => handleOpenLink(startup.demoUrl!, e)}
                    >
                      <ExternalLink size={14} className="mr-1.5" />
                      Demo
                    </Button>
                  )}
                  {startup.websiteUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center h-8"
                      onClick={(e) => handleOpenLink(startup.websiteUrl!, e)}
                    >
                      <Globe size={14} className="mr-1.5" />
                      Website
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="px-6 py-4 border-t border-border">
              <div className="flex gap-3 w-full">
                <Button 
                  variant="accent" 
                  size="sm" 
                  className="flex-1 h-9"
                  onClick={() => handleConnectClick(startup)}
                  disabled={connecting === startup.name}
                >
                  {connecting === startup.name ? (
                    <>
                      <Loader2 size={14} className="mr-1.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={14} className="mr-1.5" />
                      Connect
                    </>
                  )}
                </Button>
                <Button 
                  variant={interestedIn.includes(startup.name) ? "default" : "secondary"}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => handleExpressInterest(startup)}
                >
                  <ThumbsUp size={14} className="mr-1.5" />
                  {interestedIn.includes(startup.name) ? "Interested" : "Express Interest"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
