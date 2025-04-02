
import { useEffect, useState } from "react";
import { Search, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorCard } from "./InvestorCard";
import { EmptyState } from "./EmptyState";
import { useInvestorData } from "../../../hooks/useInvestorData";

interface InvestorListProps {
  showSearch?: boolean;
  showTabs?: boolean;
  onShowFollowers?: (userId: string) => void;
  onShowFollowing?: (userId: string) => void;
}

export const InvestorList = ({ 
  showSearch = true, 
  showTabs = true,
  onShowFollowers,
  onShowFollowing
}: InvestorListProps) => {
  const { 
    investors,
    filteredInvestors,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    fetchInvestors,
    handleRefresh
  } = useInvestorData();
  
  const [activeTab, setActiveTab] = useState<string>("all");
  const [displayedInvestors, setDisplayedInvestors] = useState(filteredInvestors);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Filter investors based on tab selection
    if (value === "all") {
      setDisplayedInvestors(filteredInvestors);
    } else if (value === "angel") {
      const angelInvestors = filteredInvestors.filter(investor => 
        investor.role?.toLowerCase().includes("angel") ||
        (!investor.role?.toLowerCase().includes("vc") && 
         !investor.role?.toLowerCase().includes("venture"))
      );
      setDisplayedInvestors(angelInvestors);
    } else if (value === "vc") {
      const vcInvestors = filteredInvestors.filter(investor => 
        investor.role?.toLowerCase().includes("vc") || 
        investor.role?.toLowerCase().includes("venture")
      );
      setDisplayedInvestors(vcInvestors);
    }
  };
  
  // Update displayed investors when filtered investors change
  useEffect(() => {
    // Maintain current tab filter when search results change
    handleTabChange(activeTab);
  }, [filteredInvestors]);
  
  // If loading and not refreshing, show loading state
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-2">Loading investors...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {showSearch && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-lg font-medium">Find Investors</h2>
          
          <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                placeholder="Search investors by name, industry, or location"
                className="pl-9 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing}
              title="Refresh investor data"
              className="h-10 w-10 rounded-md"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>
      )}
      
      {showTabs && (
        <Tabs defaultValue="all" className="mb-6" value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Investors</TabsTrigger>
            <TabsTrigger value="angel">Angel Investors</TabsTrigger>
            <TabsTrigger value="vc">Venture Capital</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      {displayedInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {displayedInvestors.map((investor) => (
            <InvestorCard 
              key={investor.id} 
              investor={investor} 
              onShowFollowers={onShowFollowers}
              onShowFollowing={onShowFollowing}
            />
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
    </div>
  );
};
