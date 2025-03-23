
import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvestorCard } from "./InvestorCard";
import { Loader2 } from "lucide-react";

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

interface InvestorListProps {
  investors: Investor[];
  loading: boolean;
  refreshing: boolean;
  searchQuery: string;
  sendingMessage: string | null;
  onClearSearch: () => void;
  onConnect: (investorId: string, investorName: string) => void;
}

export const InvestorList = ({
  investors,
  loading,
  refreshing,
  searchQuery,
  sendingMessage,
  onClearSearch,
  onConnect
}: InvestorListProps) => {
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-2">Loading investors...</span>
      </div>
    );
  }

  if (investors.length === 0) {
    return (
      <div className="text-center py-16 bg-background/30 rounded-lg border border-border/60">
        <Search size={48} className="mx-auto text-muted-foreground/60" />
        <h3 className="mt-4 text-lg font-medium">No investors found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {searchQuery 
            ? `No results for "${searchQuery}"`
            : "There are no investors available at the moment."}
        </p>
        {searchQuery && (
          <Button 
            variant="link" 
            className="mt-2"
            onClick={onClearSearch}
          >
            Clear search
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {investors.map((investor) => (
        <InvestorCard 
          key={investor.id} 
          investor={investor} 
          onConnect={onConnect}
          isConnecting={sendingMessage}
        />
      ))}
    </div>
  );
};
