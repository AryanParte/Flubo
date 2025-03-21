
import React, { useEffect, useState } from "react";
import { MessageSquare, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type InvestorMatch = {
  id: string;
  name: string;
  score: number;
  region: string;
  focus: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export const MatchesTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<InvestorMatch[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user) {
      fetchInvestorMatches();
    }
  }, [user]);

  const fetchInvestorMatches = async () => {
    try {
      setLoading(true);
      
      // Fetch all investor matches for the startup
      const { data, error } = await supabase
        .from('investor_matches')
        .select(`
          *,
          investor:investor_id(id, name)
        `)
        .eq('startup_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        // If we have no matches yet, create some sample matches for demonstration
        if (data.length === 0) {
          await createSampleMatches();
          const { data: newMatches, error: newError } = await supabase
            .from('investor_matches')
            .select(`
              *,
              investor:investor_id(id, name)
            `)
            .eq('startup_id', user.id);
          
          if (newError) throw newError;
          
          if (newMatches) {
            formatMatchesData(newMatches);
          }
        } else {
          formatMatchesData(data);
        }
      }
    } catch (error) {
      console.error("Error fetching investor matches:", error);
      toast({
        title: "Error",
        description: "Failed to load investor matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMatchesData = (data: any[]) => {
    const formattedMatches = data.map(match => ({
      id: match.id,
      name: match.investor?.name || "Unknown Investor",
      score: match.match_score,
      region: "Global", // This would come from the investor profile in a real app
      focus: "Various Industries", // This would come from the investor profile in a real app
      status: match.status
    }));
    
    setMatches(formattedMatches);
  };

  const createSampleMatches = async () => {
    // Create sample investor profiles if they don't exist
    const sampleInvestors = [
      { name: "Blue Venture Capital", user_type: "investor" },
      { name: "Global Impact Fund", user_type: "investor" },
      { name: "Tech Accelerator Group", user_type: "investor" },
      { name: "Midwest Angels", user_type: "investor" },
      { name: "Green Future Fund", user_type: "investor" }
    ];
    
    let investorIds = [];
    
    for (const investor of sampleInvestors) {
      // Check if we already have this investor
      const { data: existingInvestor } = await supabase
        .from('profiles')
        .select('id')
        .eq('name', investor.name)
        .single();
      
      if (existingInvestor) {
        investorIds.push(existingInvestor.id);
      } else {
        // Generate a UUID for the new sample investor
        const newId = crypto.randomUUID();
        
        // Create a new sample investor with explicit ID
        const { data: newInvestor, error: investorError } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            name: investor.name,
            user_type: investor.user_type
          })
          .select('id')
          .single();
        
        if (investorError) {
          console.error("Error creating sample investor:", investorError);
          continue;
        }
        
        if (newInvestor) {
          investorIds.push(newInvestor.id);
        }
      }
    }
    
    // Create sample matches with the investors
    const sampleMatches = [
      { investor_index: 0, score: 92, status: 'accepted' },
      { investor_index: 1, score: 87, status: 'pending' },
      { investor_index: 2, score: 84, status: 'pending' },
      { investor_index: 3, score: 79, status: 'accepted' },
      { investor_index: 4, score: 75, status: 'rejected' }
    ];
    
    for (let i = 0; i < sampleMatches.length; i++) {
      const match = sampleMatches[i];
      if (i < investorIds.length) {
        await supabase
          .from('investor_matches')
          .insert({
            startup_id: user.id,
            investor_id: investorIds[match.investor_index],
            match_score: match.score,
            status: match.status
          });
      }
    }
  };

  const handleContactClick = (investorName: string) => {
    toast({
      title: "Contact initiated",
      description: `Opening chat with ${investorName}`,
    });
  };

  const handleViewProfile = (investorName: string) => {
    toast({
      title: "View profile",
      description: `Viewing ${investorName}'s profile`,
    });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const filteredMatches = matches.filter(match => {
    if (activeTab === 'all') return true;
    return match.status === activeTab;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Matches</TabsTrigger>
          <TabsTrigger value="pending">New</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((investor, index) => (
                <div 
                  key={investor.id} 
                  className="rounded-lg border border-border p-5 bg-background/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                        {investor.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{investor.name}</h3>
                        <p className="text-xs text-muted-foreground">{investor.region}</p>
                      </div>
                    </div>
                    <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1">
                      {investor.score}% Match
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    Focus: {investor.focus}
                  </p>

                  <div className="text-xs text-muted-foreground mb-4 flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      investor.status === 'pending' ? 'bg-blue-500' : 
                      investor.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="capitalize">{investor.status === 'pending' ? 'New' : investor.status}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProfile(investor.name)}
                    >
                      <Info size={14} className="mr-1" />
                      Profile
                    </Button>
                    <Button 
                      variant="accent" 
                      size="sm"
                      className="flex-1"
                      onClick={() => handleContactClick(investor.name)}
                    >
                      <MessageSquare size={14} className="mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} investor matches found</p>
              {activeTab === 'all' && (
                <p className="text-sm mt-2 text-muted-foreground">Complete your profile to attract more investors</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
