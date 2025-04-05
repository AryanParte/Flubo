
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Startup } from "@/types/startup";
import { useAuth } from "@/context/AuthContext";
import { fetchCompanies, recordInterest, skipCompany } from "@/services/company-discovery-service";
import { enrichCompanyData, sortCompanies, filterByMatchScore } from "@/utils/company-utils";

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
  
  const loadCompanies = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch raw company data
      const rawCompanies = await fetchCompanies(user.id, appliedFilters, sortOption);
      
      if (!rawCompanies) {
        setCompanies([]);
        return;
      }
      
      // Process the data
      const enrichedCompanies = enrichCompanyData(rawCompanies);
      
      console.log("Fetched companies with website data:", enrichedCompanies.map(c => ({
        id: c.id,
        name: c.name,
        website: c.website,
        websiteUrl: c.websiteUrl
      })));
      
      // Sort and filter companies
      let processedCompanies = sortCompanies(enrichedCompanies, sortOption);
      processedCompanies = filterByMatchScore(processedCompanies, appliedFilters.minMatch);
      
      setCompanies(processedCompanies);
    } catch (error) {
      console.error('Error in loadCompanies:', error);
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
    loadCompanies();
  }, [loadCompanies]);
  
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
      
      const result = await recordInterest(user.id, companyId, company.score);
      
      if (!result.success) return;
      
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
      const result = await skipCompany(user.id, companyId);
      
      if (!result.success) return;
      
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
