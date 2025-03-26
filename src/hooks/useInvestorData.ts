
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Investor } from "../types/investor";

export const useInvestorData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Setup a real-time subscription to profiles changes
  useEffect(() => {
    if (user) {
      const setupRealtimeSubscription = async () => {
        // Set up realtime subscription for profile changes
        const channel = supabase
          .channel('investor-profiles-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: "user_type=eq.investor"
            },
            (payload) => {
              console.log("Investor profile updated, refreshing data:", payload);
              fetchInvestors();
            }
          )
          .subscribe();
          
        // Also set up realtime subscription for investor preferences
        const prefsChannel = supabase
          .channel('investor-preferences-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'investor_preferences'
            },
            (payload) => {
              console.log("Investor preferences updated, refreshing data:", payload);
              fetchInvestors();
            }
          )
          .subscribe();
          
        // Also set up realtime subscription for AI persona chats
        const aiChatsChannel = supabase
          .channel('ai-persona-chats-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ai_persona_chats'
            },
            (payload) => {
              console.log("AI persona chat updated, refreshing data:", payload);
              fetchInvestors();
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
          supabase.removeChannel(prefsChannel);
          supabase.removeChannel(aiChatsChannel);
        };
      };
      
      const cleanup = setupRealtimeSubscription();
      fetchInvestors();
      
      return () => {
        cleanup.then(unsub => unsub);
      };
    }
  }, [user]);
  
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      console.log("Fetching investors for startup user:", user?.id);
      
      // Fetch all profiles with user_type = 'investor'
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, company, position, user_type')
        .eq('user_type', 'investor');
      
      if (profilesError) throw profilesError;
      
      // Fetch investor preferences for additional data
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('investor_preferences')
        .select('*');
        
      if (preferencesError) throw preferencesError;
      
      // Create a map of preferences by user_id for easy lookup
      const preferencesMap = new Map();
      preferencesData?.forEach(pref => {
        preferencesMap.set(pref.user_id, pref);
      });
      
      // Fetch AI chats for this startup user
      const { data: aiChatsData, error: aiChatsError } = await supabase
        .from('ai_persona_chats')
        .select('investor_id, match_score')
        .eq('startup_id', user?.id)
        .eq('completed', true);
        
      if (aiChatsError) throw aiChatsError;
      
      // Create a map of AI chat match scores by investor_id
      const aiMatchScoresMap = new Map();
      aiChatsData?.forEach(chat => {
        aiMatchScoresMap.set(chat.investor_id, chat.match_score);
      });
      
      console.log("Found investors:", profilesData?.length || 0);
      
      // Transform the data to include all investor details
      const enhancedInvestors = profilesData?.map(investor => {
        // Get preferences for this investor if they exist
        const preferences = preferencesMap.get(investor.id);
        
        // Get AI chat match score if it exists
        const aiMatchScore = aiMatchScoresMap.get(investor.id);
        
        return {
          id: investor.id,
          name: investor.name || 'Unknown Investor',
          email: investor.email,
          role: investor.position || 'Angel Investor',
          company: investor.company || 'Independent',
          bio: "Angel investor with a focus on early-stage startups in technology and innovation.",
          location: "San Francisco, CA",
          industry: preferences?.preferred_sectors?.[0] || "Technology",
          investment_stage: preferences?.preferred_stages || [],
          preferred_stages: preferences?.preferred_stages || [],
          preferred_sectors: preferences?.preferred_sectors || [],
          min_investment: preferences?.min_investment,
          max_investment: preferences?.max_investment,
          investment_size: preferences?.min_investment && preferences?.max_investment
            ? `${preferences.min_investment} - ${preferences.max_investment}`
            : preferences?.min_investment
              ? `${preferences.min_investment}+`
              : undefined,
          match_score: aiMatchScore || null
        };
      }) || [];
      
      setInvestors(enhancedInvestors);
      setFilteredInvestors(enhancedInvestors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      toast({
        title: "Error",
        description: "Failed to load investors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvestors();
    toast({
      title: "Refreshed",
      description: "Investor data has been updated",
    });
  };
  
  useEffect(() => {
    // Filter investors based on search query
    if (searchQuery.trim() === "") {
      setFilteredInvestors(investors);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = investors.filter(investor => 
        investor.name?.toLowerCase().includes(lowercaseQuery) ||
        investor.industry?.toLowerCase().includes(lowercaseQuery) ||
        investor.location?.toLowerCase().includes(lowercaseQuery) ||
        investor.company?.toLowerCase().includes(lowercaseQuery) ||
        investor.preferred_sectors?.some(sector => sector.toLowerCase().includes(lowercaseQuery)) ||
        investor.preferred_stages?.some(stage => stage.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredInvestors(filtered);
    }
  }, [searchQuery, investors]);
  
  return {
    investors,
    filteredInvestors,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    fetchInvestors,
    handleRefresh
  };
};
