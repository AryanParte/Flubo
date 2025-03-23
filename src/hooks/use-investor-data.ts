
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

type Investor = {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  industry?: string;
  location?: string;
  role?: string;
  company?: string;
};

export function useInvestorData(userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (userId) {
      fetchInvestors();
      
      // Set up realtime subscription for profile changes
      const channel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: "user_type=eq.investor"
          },
          () => {
            console.log("Investor profile updated, refreshing data");
            fetchInvestors();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);
  
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      console.log("Fetching investors for startup user:", userId);
      
      // Fetch all profiles with user_type = 'investor'
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, company, position, user_type')
        .eq('user_type', 'investor');
      
      if (error) throw error;
      
      console.log("Found investors:", data?.length || 0);
      
      // Transform the data to include investor details
      const enhancedInvestors = data?.map(investor => ({
        id: investor.id,
        name: investor.name || 'Unknown Investor',
        email: investor.email,
        role: investor.position || 'Angel Investor',
        company: investor.company || 'Tech Ventures',
        bio: "Angel investor with a focus on early-stage startups in technology and innovation.",
        industry: "Technology",
        location: "San Francisco, CA",
      })) || [];
      
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
        investor.company?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredInvestors(filtered);
    }
  }, [searchQuery, investors]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Here you could implement filtering by investor type if needed
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return {
    loading,
    refreshing,
    investors: filteredInvestors,
    searchQuery,
    activeTab,
    handleRefresh,
    handleTabChange,
    handleSearch,
    clearSearch
  };
}
