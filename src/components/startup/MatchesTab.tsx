
import { useState, useEffect } from "react";
import { Calendar, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export const MatchesTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  
  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      // Fetch all investor matches
      const { data, error } = await supabase
        .from('investor_matches')
        .select(`
          id, 
          match_score,
          status,
          created_at,
          investor:investor_id (id, name)
        `)
        .eq('startup_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Enhance each match with more investor details where possible
      const enhancedMatches = await Promise.all((data || []).map(async (match) => {
        if (!match.investor?.id) {
          return match;
        }
        
        try {
          // Get more details from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', match.investor.id)
            .maybeSingle();
          
          return {
            ...match,
            investor: {
              ...match.investor,
              name: profileData?.name || 'Anonymous Investor',
              email: profileData?.email
            }
          };
        } catch (error) {
          console.error("Error fetching investor profile:", error);
          return match;
        }
      }));
      
      setMatches(enhancedMatches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast({
        title: "Error",
        description: "Failed to load investor matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };
  
  const filteredMatches = matches.filter(match => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return match.status === "pending";
    if (activeFilter === "accepted") return match.status === "accepted";
    return false;
  });
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const handleContactInvestor = (match) => {
    // Navigate to messages with this investor pre-selected
    navigate('/startup/messages');
    
    toast({
      title: "Message investor",
      description: `Contact ${match.investor?.name || 'investor'} initialized`,
    });
  };
  
  const handleResponseChange = async (matchId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('investor_matches')
        .update({ status: newStatus })
        .eq('id', matchId);
        
      if (error) throw error;
      
      // Update local state
      setMatches(matches.map(match => {
        if (match.id === matchId) {
          return { ...match, status: newStatus };
        }
        return match;
      }));
      
      toast({
        title: `Match ${newStatus}`,
        description: `You have ${newStatus} the investor match`,
      });
    } catch (error) {
      console.error("Error updating match status:", error);
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex border border-border rounded-lg overflow-hidden w-fit">
        {[
          { id: "all", label: "All Matches" },
          { id: "pending", label: "Pending" },
          { id: "accepted", label: "Accepted" }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterChange(filter.id)}
            className={`px-4 py-2 text-sm font-medium ${
              activeFilter === filter.id
                ? "bg-accent text-accent-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Matches list */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-6">Investor Matches</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent text-accent"></div>
            <p className="mt-2 text-muted-foreground">Loading matches...</p>
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div 
                key={match.id} 
                className="p-4 border border-border/60 rounded-lg bg-background/40"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-start space-x-3 mb-4 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      {match.investor?.name?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <h3 className="font-medium">{match.investor?.name || 'Anonymous Investor'}</h3>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar size={12} className="mr-1" />
                        <span>Matched on {formatDate(match.created_at)}</span>
                      </div>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs font-medium mr-2">Match Score:</span>
                        <div className="h-2 w-20 bg-secondary rounded-full">
                          <div 
                            className="h-2 bg-accent rounded-full" 
                            style={{ width: `${match.match_score || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs ml-2">{match.match_score || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {match.status === "pending" ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResponseChange(match.id, 'rejected')}
                        >
                          Decline
                        </Button>
                        <Button 
                          variant="accent" 
                          size="sm"
                          onClick={() => handleResponseChange(match.id, 'accepted')}
                        >
                          Accept
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          match.status === 'accepted' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                        }`}>
                          {match.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                        
                        {match.status === 'accepted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                            onClick={() => handleContactInvestor(match)}
                          >
                            <Mail size={14} className="mr-1" />
                            <span>Contact</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background/30 rounded-lg border border-border/60">
            <Users size={48} className="mx-auto text-muted-foreground/60" />
            <h3 className="mt-4 text-lg font-medium">No matches found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeFilter !== "all" 
                ? `You don't have any ${activeFilter} matches yet.`
                : "Complete your profile to get matched with investors."}
            </p>
            {activeFilter !== "all" && (
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setActiveFilter("all")}
              >
                View all matches
              </Button>
            )}
            {activeFilter === "all" && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/startup/profile')}
              >
                Complete Profile
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
