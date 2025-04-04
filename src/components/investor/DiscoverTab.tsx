
import React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./discover/FilterBar";
import { StartupCard } from "./discover/StartupCard";
import { MessageDialog } from "./discover/MessageDialog";
import { useDiscoverStartups } from "@/hooks/use-discover-startups";
import { useAuth } from "@/context/AuthContext";

export const DiscoverTab = () => {
  const { user } = useAuth();
  const {
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
  } = useDiscoverStartups();
  
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
          <p>Loading startups...</p>
        </div>
      ) : startups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No startups available at the moment.</p>
          <p className="text-sm text-muted-foreground">Check back later for new startup listings.</p>
        </div>
      ) : (
        <>
          {/* Startup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map((startup, index) => (
              <StartupCard 
                key={startup.id}
                startup={startup}
                index={index}
                onInterested={handleInterestedClick}
                onSkip={handleSkipClick}
              />
            ))}
          </div>
          
          {/* Load More */}
          {startups.length > 0 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={handleLoadMore}
              >
                Load More Startups
              </Button>
            </div>
          )}
        </>
      )}

      {/* Message Dialog */}
      {selectedStartup && user && (
        <MessageDialog
          isOpen={messageDialogOpen}
          onClose={handleCloseMessageDialog}
          startupId={selectedStartup.id}
          startupName={selectedStartup.name}
          userId={user.id}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
};
