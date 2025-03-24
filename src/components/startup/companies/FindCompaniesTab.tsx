
import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./FilterBar";
import { CompanyCard } from "./CompanyCard";
import { MessageDialog } from "./MessageDialog";
import { useDiscoverCompanies } from "@/hooks/use-discover-companies";
import { useAuth } from "@/context/AuthContext";

export const FindCompaniesTab = () => {
  const { user } = useAuth();
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
  
  return (
    <div>
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
