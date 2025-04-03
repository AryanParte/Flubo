
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
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [userName, setUserName] = useState("");
  const [userTitle, setUserTitle] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [profileViews, setProfileViews] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, verified, title, location, profile_views')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }
        
        if (data) {
          setUserName(data.name || "");
          setIsVerified(!!data.verified);
          setUserTitle(data.title || "Investor");
          setUserLocation(data.location || "");
          setProfileViews(data.profile_views || 0);
          
          // Show verification dialog for unverified users after a delay
          // But only if they haven't seen it before (we could use localStorage for this)
          const hasSeenVerificationPrompt = localStorage.getItem("hasSeenVerificationPrompt");
          if (!data.verified && !hasSeenVerificationPrompt) {
            setTimeout(() => {
              setShowVerificationDialog(true);
              localStorage.setItem("hasSeenVerificationPrompt", "true");
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
  
  const handleVerificationClick = () => {
    setShowVerificationDialog(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Profile Summary */}
            <div className="lg:col-span-3">
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex flex-col items-center">
                    <Avatar className="w-24 h-24 border-4 border-background">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                      <AvatarFallback className="text-xl">{userName?.charAt(0) || "I"}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="mt-4 text-xl text-center">
                      {userName || "Investor"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground text-center mt-1">
                      {userTitle}
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      {userLocation || "Location not specified"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-2">
                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Profile views</span>
                      <span className="text-lg font-bold text-accent">{profileViews}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0">
                  {!isVerified && (
                    <Button 
                      variant="accent" 
                      className="w-full justify-center"
                      onClick={handleVerificationClick}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Get Verified
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/investor/profile')}
                  >
                    View Full Profile
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quick Analytics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Startups Matched</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium">9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portfolio Growth</span>
                    <span className="font-medium">+12%</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => handleTabChange("analytics")}>
                    View all analytics
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Middle Column - Tab Content */}
            <div className="lg:col-span-6">
              {/* AI Search - now visible on all tabs for easier access */}
              <div className="glass-card rounded-lg p-4 mb-6 animate-fade-in">
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
              
              {/* Dashboard Content */}
              <div className="bg-card rounded-md shadow-sm p-5">
                {activeTab === "feed" && <FeedTab />}
                {activeTab === "discover" && <DiscoverTab />}
                {activeTab === "matches" && <MatchesTab />}
                {activeTab === "portfolio" && <PortfolioTab />}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "search-results" && <AISearchResultsTab results={searchResults} />}
              </div>
            </div>
            
            {/* Right Column - Trending & News */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Trending Startups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-accent/5 p-3 rounded-md">
                      <h4 className="font-medium text-sm">NeuralFlow</h4>
                      <p className="text-xs text-muted-foreground mt-1">AI-driven data processing platform gaining major traction in enterprise.</p>
                    </div>
                    
                    <div className="bg-accent/5 p-3 rounded-md">
                      <h4 className="font-medium text-sm">GreenPath Solutions</h4>
                      <p className="text-xs text-muted-foreground mt-1">Sustainable logistics startup raising Series A with impressive metrics.</p>
                    </div>
                    
                    <div className="bg-accent/5 p-3 rounded-md">
                      <h4 className="font-medium text-sm">MedTech Innovations</h4>
                      <p className="text-xs text-muted-foreground mt-1">Healthcare startup with breakthrough device for remote patient monitoring.</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 h-auto">
                    View all trending startups
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Market Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI/ML Funding</span>
                    <span className="text-green-600">+18%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>FinTech Valuations</span>
                    <span className="text-red-500">-3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>CleanTech Deals</span>
                    <span className="text-green-600">+42%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Healthcare IPOs</span>
                    <span className="text-green-600">+8%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
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
