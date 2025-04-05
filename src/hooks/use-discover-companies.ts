
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Startup } from "@/types/startup";
import { useAuth } from "@/context/AuthContext";

export type AppliedFilters = {
  stage?: string[];
  industry?: string[];
  location?: string[];
  minMatch?: number;
};

export type SortOption = "match" | "recent" | "raised";

export const useDiscoverCompanies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});
  const [sortOption, setSortOption] = useState<SortOption>("match");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Startup | null>(null);
  
  const fetchCompanies = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const { data: existingConnections } = await supabase
        .from('investor_matches')
        .select('startup_id')
        .eq('investor_id', user.id);
      
      const excludedIds = existingConnections?.map(match => match.startup_id) || [];
      
      if (user.id) {
        excludedIds.push(user.id);
      }
      
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
          created_at,
          looking_for_funding,
          looking_for_design_partner,
          demo_url,
          demo_video,
          demo_video_path,
          website
        `);
      
      if (excludedIds.length > 0) {
        for (const id of excludedIds) {
          if (id) {
            query = query.neq('id', id);
          }
        }
      }
      
      query = query.limit(20);
      
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
        console.error('Error fetching companies:', error);
        toast({
          title: 'Error',
          description: 'Failed to load companies',
          variant: 'destructive',
        });
        return;
      }
      
      const enrichedCompanies = data.map(company => {
        const websiteField = company.website && typeof company.website === 'string' ? company.website.trim() : '';
        
        return {
          ...company,
          score: Math.floor(Math.random() * 40) + 60,
          lookingForFunding: company.looking_for_funding || false,
          lookingForDesignPartner: company.looking_for_design_partner || false,
          website: websiteField,
          websiteUrl: websiteField,
          demoUrl: company.demo_url || '#',
          demoVideo: company.demo_video || undefined,
          demoVideoPath: company.demo_video_path || undefined
        };
      });
      
      console.log("Fetched companies with website data:", enrichedCompanies.map(c => ({
        id: c.id,
        name: c.name,
        website: c.website,
        websiteUrl: c.websiteUrl
      })));
      
      let sortedCompanies = [...enrichedCompanies];
      
      if (sortOption === 'match') {
        sortedCompanies.sort((a, b) => b.score - a.score);
      } else if (sortOption === 'recent') {
        sortedCompanies.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortOption === 'raised') {
        sortedCompanies.sort((a, b) => {
          const amountA = parseFloat(a.raised_amount?.replace(/[^0-9.-]+/g, '') || '0');
          const amountB = parseFloat(b.raised_amount?.replace(/[^0-9.-]+/g, '') || '0');
          return amountB - amountA;
        });
      }
      
      if (appliedFilters.minMatch) {
        sortedCompanies = sortedCompanies.filter(company => 
          company.score >= appliedFilters.minMatch!
        );
      }
      
      setCompanies(sortedCompanies);
    } catch (error) {
      console.error('Error in fetchCompanies:', error);
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
    fetchCompanies();
  }, [fetchCompanies]);
  
  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };
  
  const handleInterestedClick = useCallback(async (companyId: string) => {
    if (!user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) return;
      
      setSelectedCompany(company);
      setMessageDialogOpen(true);
      
      const { error } = await supabase
        .from('investor_matches')
        .insert({
          investor_id: user.id,
          startup_id: companyId,
          match_score: company.score,
          status: 'pending' // Changed from 'interested' to 'pending' to match allowed values
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
      
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      
    } catch (error) {
      console.error('Error in handleInterestedClick:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  }, [user?.id, companies]);
  
  const handleSkipClick = useCallback(async (companyId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('investor_matches')
        .insert({
          investor_id: user.id,
          startup_id: companyId,
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
      
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      
      toast({
        title: 'Company skipped',
        description: 'You won\'t see this company again',
      });
    } catch (error) {
      console.error('Error in handleSkipClick:', error);
    }
  }, [user?.id]);
  
  const handleLoadMore = () => {
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
      title: 'Connection created!',
      description: 'You can now message this company directly',
    });
    
    navigate('/business/messages');
  };
  
  return {
    companies,
    loading,
    appliedFilters,
    setAppliedFilters,
    sortOption,
    handleSortChange,
    handleInterestedClick,
    handleSkipClick,
    handleLoadMore,
    messageDialogOpen,
    selectedCompany,
    handleCloseMessageDialog,
    handleMessageSent,
  };
};
