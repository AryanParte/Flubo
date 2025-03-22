
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Startup } from "@/types/startup";
import { useAuth } from "@/context/AuthContext";

type AppliedFilters = {
  stage?: string[];
  industry?: string[];
  location?: string[];
  minMatch?: number;
};

type SortOption = "match" | "recent" | "raised";

export const useDiscoverStartups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});
  const [sortOption, setSortOption] = useState<SortOption>("match");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  
  // Fetch startups
  const fetchStartups = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get existing matches to exclude them
      const { data: existingMatches } = await supabase
        .from('investor_matches')
        .select('startup_id')
        .eq('investor_id', user.id);
      
      const excludedIds = existingMatches?.map(match => match.startup_id) || [];
      
      // Fetch startups from the database
      let query = supabase
        .from('startup_profiles')
        .select(`
          id,
          name,
          tagline,
          bio,
          industry,
          location,
          stage,
          raised_amount,
          created_at
        `)
        .eq('user_type', 'startup')
        .not('id', 'in', `(${excludedIds.join(',')})`)
        .limit(20);
      
      // Apply filters
      if (appliedFilters.stage && appliedFilters.stage.length > 0) {
        query = query.in('stage', appliedFilters.stage);
      }
      
      if (appliedFilters.industry && appliedFilters.industry.length > 0) {
        query = query.in('industry', appliedFilters.industry);
      }
      
      if (appliedFilters.location && appliedFilters.location.length > 0) {
        query = query.in('location', appliedFilters.location);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching startups:', error);
        toast({
          title: 'Error',
          description: 'Failed to load startups',
          variant: 'destructive',
        });
        return;
      }
      
      // Transform data and add match score
      const enrichedStartups = data.map(startup => ({
        ...startup,
        score: Math.floor(Math.random() * 40) + 60, // 60-99% match
      }));
      
      // Sort startups
      let sortedStartups = [...enrichedStartups];
      
      if (sortOption === 'match') {
        sortedStartups.sort((a, b) => b.score - a.score);
      } else if (sortOption === 'recent') {
        sortedStartups.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortOption === 'raised') {
        sortedStartups.sort((a, b) => {
          const amountA = parseFloat(a.raised_amount?.replace(/[^0-9.-]+/g, '') || '0');
          const amountB = parseFloat(b.raised_amount?.replace(/[^0-9.-]+/g, '') || '0');
          return amountB - amountA;
        });
      }
      
      // Filter by minimum match if specified
      if (appliedFilters.minMatch) {
        sortedStartups = sortedStartups.filter(startup => 
          startup.score >= appliedFilters.minMatch!
        );
      }
      
      setStartups(sortedStartups);
    } catch (error) {
      console.error('Error in fetchStartups:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, appliedFilters, sortOption]);
  
  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);
  
  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };
  
  const handleInterestedClick = useCallback(async (startupId: string) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Find the startup
      const startup = startups.find(s => s.id === startupId);
      if (!startup) return;
      
      // Set the selected startup and open message dialog
      setSelectedStartup(startup);
      setMessageDialogOpen(true);
      
      // Create a match record
      const { error } = await supabase
        .from('investor_matches')
        .insert({
          investor_id: user.id,
          startup_id: startupId,
          match_score: startup.score,
          status: 'interested'
        });
      
      if (error) {
        console.error('Error recording interest:', error);
        toast({
          title: 'Error',
          description: 'Failed to record your interest',
          variant: 'destructive',
        });
        return;
      }
      
      // Remove the startup from the list
      setStartups(prev => prev.filter(s => s.id !== startupId));
      
    } catch (error) {
      console.error('Error in handleInterestedClick:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [user?.id, startups]);
  
  const handleSkipClick = useCallback(async (startupId: string) => {
    if (!user?.id) return;
    
    try {
      // Create a match record with status 'skipped'
      const { error } = await supabase
        .from('investor_matches')
        .insert({
          investor_id: user.id,
          startup_id: startupId,
          status: 'skipped'
        });
      
      if (error) {
        console.error('Error recording skip:', error);
        toast({
          title: 'Error',
          description: 'Failed to record your choice',
          variant: 'destructive',
        });
        return;
      }
      
      // Remove the startup from the list
      setStartups(prev => prev.filter(s => s.id !== startupId));
      
      toast({
        title: 'Startup skipped',
        description: 'You won\'t see this startup again',
      });
    } catch (error) {
      console.error('Error in handleSkipClick:', error);
    }
  }, [user?.id]);
  
  const handleLoadMore = () => {
    // In a real app, this would fetch more startups with pagination
    toast({
      title: 'Coming soon',
      description: 'Pagination will be implemented in the future',
    });
  };
  
  const handleCloseMessageDialog = () => {
    setMessageDialogOpen(false);
  };
  
  const handleMessageSent = () => {
    toast({
      title: 'Match created!',
      description: 'You can now message this startup directly',
    });
    
    // Navigate to messages page
    navigate('/investor/messages');
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
    messageDialogOpen,
    selectedStartup,
    handleCloseMessageDialog,
    handleMessageSent,
  };
};
