
import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./FilterBar";
import { CompanyCard } from "./CompanyCard";
import { MessageDialog } from "./MessageDialog";
import { useDiscoverCompanies } from "@/hooks/use-discover-companies";
import { useAuth } from "@/context/AuthContext";

export const FindCompaniesTab = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const {
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
  } = useDiscoverCompanies();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
  };
  
  return (
    <div>
      {/* Search Bar - Now positioned below the tab navigation */}
      <div className="glass-card rounded-lg p-4 mb-8 animate-fade-in">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies using natural language, e.g. 'Design agencies in Europe' or 'SaaS companies for healthcare'"
            className="w-full h-12 pl-11 pr-4 rounded-md bg-background/70 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-medium"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Filters and Sort */}
      <FilterBar 
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
        sortOption={sortOption}
        onSortChange={handleSortChange}
      />
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent mr-2" />
          <p>Loading companies...</p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No companies available at the moment.</p>
          <p className="text-sm text-muted-foreground">Check back later for new company listings.</p>
        </div>
      ) : (
        <>
          {/* Company Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company, index) => (
              <CompanyCard 
                key={company.id}
                company={company}
                index={index}
                onInterested={handleInterestedClick}
                onSkip={handleSkipClick}
              />
            ))}
          </div>
          
          {/* Load More */}
          {companies.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={handleLoadMore}
              >
                Load More Companies
              </Button>
            </div>
          )}
        </>
      )}

      {/* Message Dialog */}
      {selectedCompany && user && (
        <MessageDialog
          isOpen={messageDialogOpen}
          onClose={handleCloseMessageDialog}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          userId={user.id}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
};
