
import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "./discover/FilterBar";
import { StartupCard } from "./discover/StartupCard";
import { MessageDialog } from "./discover/MessageDialog";
import { useDiscoverStartups } from "@/hooks/use-discover-startups";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface DiscoverTabProps {
  onSearchResults?: (results: any) => void;
}

export const DiscoverTab = ({ onSearchResults }: DiscoverTabProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
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
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Search query empty",
        description: "Please enter a search term",
      });
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to use the search feature",
      });
      return;
    }
    
    try {
      setSearching(true);
      
      console.log("Sending search query:", searchQuery);
      
      // Call the AI-powered edge function
      const { data, error } = await supabase.functions.invoke('investor-search-ai', {
        body: { query: searchQuery, userId: user.id }
      });
      
      if (error) {
        console.error("Search error:", error);
        throw error;
      }
      
      console.log("Search results:", data);
      
      if (onSearchResults) {
        onSearchResults(data.results);
      }
      
      toast({
        title: "AI Search complete",
        description: `Found ${data.results.length} startups matching your query`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message || "Failed to process your search query",
      });
    } finally {
      setSearching(false);
    }
  };
  
  return (
    <div>
      {/* AI Search - now only visible in the Discover tab */}
      <div className="glass-card rounded-lg p-4 mb-8 animate-fade-in">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Use AI to search startups, e.g. 'AI startups in India' or 'Seed stage fintech companies'"
            className="w-full h-12 pl-11 pr-4 rounded-md bg-background/70 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={searching}
          />
          <button 
            type="submit" 
            className="absolute right-2 top-2 bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 disabled:opacity-70"
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <>
                <Loader2 size={16} className="animate-spin mr-1" />
                <span>Searching...</span>
              </>
            ) : (
              <span>AI Search</span>
            )}
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
