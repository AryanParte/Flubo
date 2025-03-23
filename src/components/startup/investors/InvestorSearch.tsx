
import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InvestorSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: string;
}

export const InvestorSearch = ({
  searchQuery,
  onSearchChange,
  onTabChange,
  onRefresh,
  isRefreshing,
  activeTab
}: InvestorSearchProps) => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-lg font-medium">Find Investors</h2>
        
        <div className="mt-4 md:mt-0 w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search investors"
              className="pl-9"
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            disabled={isRefreshing}
            title="Refresh investor data"
            className="h-10 w-10 rounded-md"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => onTabChange('all')}>All Investors</TabsTrigger>
          <TabsTrigger value="angel" onClick={() => onTabChange('angel')}>Angel Investors</TabsTrigger>
          <TabsTrigger value="vc" onClick={() => onTabChange('vc')}>Venture Capital</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
