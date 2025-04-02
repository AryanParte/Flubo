
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { Bell, Search, Globe, Briefcase, BarChart3, ThumbsUp, Loader2, Rss } from "lucide-react";
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
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { DashboardRightSidebar } from "@/components/shared/DashboardRightSidebar";
import { useSearchParams } from "react-router-dom";

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
          
          if (!data.verified) {
            setTimeout(() => {
              setShowVerificationDialog(true);
            }, 1000);
          }
        }
      };
      
      fetchUserProfile();
      
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
          {/* Updated grid layout to make the middle column wider */}
          <div className="grid grid-cols-1 lg:grid-cols-14 gap-6">
            {/* Left sidebar - reduced width */}
            <div className="hidden lg:block lg:col-span-3">
              <DashboardSidebar 
                userName={userName} 
                userType="investor"
                isVerified={isVerified}
                onVerificationClick={() => setShowVerificationDialog(true)}
              />
            </div>
            
            {/* Main content area - increased width */}
            <div className="lg:col-span-8 space-y-4">
              <div className="glass-card rounded-lg p-4 mb-4 animate-fade-in">
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

              <div className="lg:hidden flex justify-between items-center p-4 bg-card rounded-lg border border-border/60 mb-4">
                <div>
                  <h3 className="font-medium">{userName || "Investor"}</h3>
                  <p className="text-xs text-muted-foreground">Welcome back</p>
                </div>
                {!isVerified && (
                  <button 
                    className="bg-accent text-accent-foreground px-3 py-1.5 text-xs rounded-md"
                    onClick={() => setShowVerificationDialog(true)}
                  >
                    Get Verified
                  </button>
                )}
              </div>
              
              <div className="border-b border-border/60 mb-6">
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
              
              <div className="bg-card rounded-lg border border-border/60 p-4">
                {activeTab === "feed" && <FeedTab />}
                {activeTab === "discover" && <DiscoverTab />}
                {activeTab === "matches" && <MatchesTab />}
                {activeTab === "portfolio" && <PortfolioTab />}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "search-results" && <AISearchResultsTab results={searchResults} />}
              </div>
            </div>
            
            {/* Right sidebar - reduced width */}
            <div className="hidden lg:block lg:col-span-3">
              <DashboardRightSidebar />
            </div>
          </div>
        </div>
      </main>
      <MinimalFooter />
      
      <VerificationOnboarding
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      />
    </div>
  );
};

export default InvestorDashboard;
