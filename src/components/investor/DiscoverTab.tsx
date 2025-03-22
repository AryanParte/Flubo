
import React, { useState, useEffect } from "react";
import { Filter, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

type Startup = {
  id: string;
  name: string;
  score?: number;
  stage?: string;
  location?: string;
  industry?: string;
  bio?: string;
  raised_amount?: string;
  tagline?: string;
};

export const DiscoverTab = () => {
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("match");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch startups from the database
  useEffect(() => {
    const fetchStartups = async () => {
      try {
        setLoading(true);
        
        // Fetch all startup profiles
        const { data: startupProfiles, error } = await supabase
          .from('startup_profiles')
          .select(`
            id,
            name,
            stage,
            location,
            industry,
            bio,
            raised_amount,
            tagline,
            profiles(user_type)
          `)
          .eq('profiles.user_type', 'startup');
        
        if (error) {
          console.error("Error fetching startups:", error);
          toast({
            title: "Error",
            description: "Failed to load startups",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (startupProfiles && startupProfiles.length > 0) {
          // Transform the data to match the Startup type
          const transformedStartups = startupProfiles.map((startup) => {
            // Generate a random match score between 75 and 95
            const randomScore = Math.floor(Math.random() * 21) + 75;
            
            return {
              id: startup.id,
              name: startup.name || "Unnamed Startup",
              score: randomScore,
              stage: startup.stage || "Unknown",
              location: startup.location || "Unknown",
              industry: startup.industry || "Technology",
              bio: startup.bio || "No description available",
              raised_amount: startup.raised_amount || "N/A",
              tagline: startup.tagline || "No tagline available",
            };
          });
          
          // Sort startups by match score (highest first)
          const sortedStartups = transformedStartups.sort((a, b) => 
            (b.score || 0) - (a.score || 0)
          );
          
          setStartups(sortedStartups);
        } else {
          // No startups found, show a message
          toast({
            title: "No startups found",
            description: "There are currently no startups in the database",
          });
        }
      } catch (error) {
        console.error("Error in fetchStartups:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStartups();
  }, []);

  const handleFilterClick = () => {
    toast({
      title: "Filter options",
      description: "Filter functionality will be implemented soon",
    });
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setAppliedFilters(appliedFilters.filter(filter => filter !== filterToRemove));
    toast({
      title: "Filter removed",
      description: `Removed "${filterToRemove}" filter`,
    });
  };

  const handleInterestedClick = async (startupId: string) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to show interest in startups",
          variant: "destructive",
        });
        return;
      }

      // Record the interest in the database
      const { error } = await supabase
        .from('investor_matches')
        .insert({
          investor_id: user.id,
          startup_id: startupId,
          status: 'interested',
          match_score: startups.find(s => s.id === startupId)?.score || 80
        });

      if (error) {
        console.error("Error recording interest:", error);
        toast({
          title: "Error",
          description: "Failed to record your interest",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Interest registered",
        description: "Startup added to your matches",
      });

      // Remove the startup from the discover feed
      setStartups(prevStartups => 
        prevStartups.filter(startup => startup.id !== startupId)
      );
      
      // Ask if they want to message the startup
      const wantToMessage = window.confirm("Would you like to send a message to this startup?");
      if (wantToMessage) {
        navigate("/investor/messages");
      }
    } catch (error) {
      console.error("Error in handleInterestedClick:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSkipClick = async (startupId: string) => {
    try {
      if (user) {
        // Record the skip in the database
        const { error } = await supabase
          .from('investor_matches')
          .insert({
            investor_id: user.id,
            startup_id: startupId,
            status: 'skipped',
            match_score: startups.find(s => s.id === startupId)?.score || 0
          });

        if (error) {
          console.error("Error recording skip:", error);
        }
      }

      toast({
        title: "Startup skipped",
        description: "Startup removed from your discover feed",
      });

      // Remove the startup from the discover feed
      setStartups(prevStartups => 
        prevStartups.filter(startup => startup.id !== startupId)
      );
    } catch (error) {
      console.error("Error in handleSkipClick:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    toast({
      title: "No more startups",
      description: "All available startups have been loaded",
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    
    // Sort the startups based on the selected option
    const sortedStartups = [...startups];
    
    if (e.target.value === "match") {
      sortedStartups.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (e.target.value === "newest") {
      // For demo purposes, just reverse the current order
      sortedStartups.reverse();
    }
    
    setStartups(sortedStartups);
  };
  
  return (
    <div>
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Button 
            variant="outline"
            size="sm"
            className="inline-flex items-center space-x-1"
            onClick={handleFilterClick}
          >
            <Filter size={14} />
            <span>Filters</span>
          </Button>
          
          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">
                  <span>{filter}</span>
                  <button 
                    className="text-accent/70 hover:text-accent"
                    onClick={() => handleRemoveFilter(filter)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <select 
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          value={sortOption}
          onChange={handleSortChange}
        >
          <option value="match">Highest Match</option>
          <option value="newest">Newest First</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent mr-2" />
          <p>Loading startups...</p>
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No startups available at the moment.</p>
          <p className="text-sm text-muted-foreground">Check back later for new startup listings.</p>
        </div>
      ) : (
        <>
          {/* Startup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map((startup, index) => (
              <div 
                key={startup.id} 
                className="glass-card rounded-lg overflow-hidden flex flex-col animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
                  <span className="font-medium text-xl">{startup.name.charAt(0)}</span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{startup.name}</h3>
                    <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                      {startup.score}% Match
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground mb-4">
                    <span className="pr-2 mr-2 border-r border-border">{startup.stage}</span>
                    <span>{startup.location}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{startup.bio || startup.tagline}</p>
                  
                  <div className="flex items-center text-xs mb-6">
                    <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
                      {startup.industry}
                    </div>
                    {startup.raised_amount && (
                      <div className="text-muted-foreground">
                        Raised: {startup.raised_amount}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto flex space-x-2">
                    <Button 
                      variant="secondary"
                      className="flex-1 flex justify-center items-center"
                      onClick={() => handleSkipClick(startup.id)}
                    >
                      <ThumbsDown size={14} className="mr-1" />
                      <span>Skip</span>
                    </Button>
                    <Button 
                      variant="accent"
                      className="flex-1 flex justify-center items-center"
                      onClick={() => handleInterestedClick(startup.id)}
                    >
                      <ThumbsUp size={14} className="mr-1" />
                      <span>Interested</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          {startups.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={handleLoadMore}
              >
                Load More Startups
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
