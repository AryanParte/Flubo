
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { Bell, Search, Globe, Briefcase, BarChart3, ThumbsUp, Loader2, Rss, UserCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DiscoverTab } from "@/components/investor/DiscoverTab";
import { MatchesTab } from "@/components/investor/MatchesTab";
import { PortfolioTab } from "@/components/investor/PortfolioTab";
import { AnalyticsTab } from "@/components/investor/AnalyticsTab";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AISearchResultsTab } from "@/components/investor/AISearchResultsTab";
import { FeedTab } from "@/components/shared/FeedTab";
import { VerificationOnboarding } from "@/components/investor/VerificationOnboarding";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [userName, setUserName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, verified')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        if (data) {
          setUserName(data.name || "");
          setIsVerified(!!data.verified);
          
          // Show verification dialog for unverified users after a delay
          if (!data.verified) {
            setTimeout(() => {
              setShowVerificationDialog(true);
            }, 1000);
          }
        }
      };
      
      fetchUserProfile();
      
      // Set the active tab if specified in URL
      const tabParam = searchParams.get("tab");
      if (tabParam && ["feed", "discover", "matches", "portfolio", "analytics"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [user, searchParams]);
  
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
      setSearchResults(null);
      
      console.log("Sending search query:", searchQuery);
      
      // Call the new AI-powered edge function
      const { data, error } = await supabase.functions.invoke('investor-search-ai', {
        body: { query: searchQuery, userId: user.id }
      });
      
      if (error) {
        console.error("Search error:", error);
        throw error;
      }
      
      console.log("Search results:", data);
      
      setSearchResults(data.results);
      setActiveTab("search-results");
      
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

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 3 unread notifications",
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Investor Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {userName || "Investor"}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
              </button>
              
              {!isVerified && (
                <Button 
                  variant="accent" 
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => setShowVerificationDialog(true)}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Get Verified</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* AI Search - now visible on all tabs for easier access */}
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
          
          {/* Dashboard Tabs */}
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "feed", label: "Feed", icon: <Rss size={16} /> },
                { id: "discover", label: "Discover Startups", icon: <Globe size={16} /> },
                { id: "matches", label: "My Matches", icon: <ThumbsUp size={16} /> },
                { id: "portfolio", label: "Portfolio", icon: <Briefcase size={16} /> },
                { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
              ].map((tab) => (
                <button
                  id={`${tab.id}-tab-button`}
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div>
            {activeTab === "feed" && <FeedTab />}
            {activeTab === "discover" && <DiscoverTab />}
            {activeTab === "matches" && <MatchesTab />}
            {activeTab === "portfolio" && <PortfolioTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "search-results" && <AISearchResultsTab results={searchResults} />}
          </div>
        </div>
      </main>
      <MinimalFooter />
      
      {/* Verification Dialog */}
      <VerificationOnboarding
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      />
    </div>
  );
};

export default InvestorDashboard;
