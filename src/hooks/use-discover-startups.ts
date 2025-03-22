
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Startup } from "@/types/startup";

export const useDiscoverStartups = () => {
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("match");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch startups from the database
  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      setLoading(true);
      
      // First, check if the user has already matched with any startups
      let skippedOrMatchedIds: string[] = [];
      
      if (user) {
        const { data: existingMatches } = await supabase
          .from('investor_matches')
          .select('startup_id')
          .eq('investor_id', user.id);
        
        if (existingMatches && existingMatches.length > 0) {
          skippedOrMatchedIds = existingMatches.map(match => match.startup_id as string);
        }
      }
      
      // Fetch all startup profiles that haven't been matched or skipped
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
        .eq('profiles.user_type', 'startup')
        .not('id', 'in', skippedOrMatchedIds.length > 0 ? `(${skippedOrMatchedIds.join(',')})` : '()');
      
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
          description: "There are currently no startups in the database or you've already reviewed all available startups",
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

  const handleLoadMore = () => {
    toast({
      title: "Loading more startups",
      description: "Fetching additional startups...",
    });
    
    // Here you would implement pagination logic
    // For now, just show a message
    setTimeout(() => {
      toast({
        title: "No more startups",
        description: "All available startups have been loaded",
      });
    }, 1000);
  };

  return {
    startups,
    loading,
    appliedFilters,
    setAppliedFilters,
    sortOption,
    handleSortChange,
    handleInterestedClick,
    handleSkipClick,
    handleLoadMore,
  };
};
