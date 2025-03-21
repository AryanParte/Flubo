
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Search, Globe, Briefcase, BarChart3, Settings, ThumbsUp, User, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { DiscoverTab } from "@/components/investor/DiscoverTab";
import { MatchesTab } from "@/components/investor/MatchesTab";
import { PortfolioTab } from "@/components/investor/PortfolioTab";
import { AnalyticsTab } from "@/components/investor/AnalyticsTab";
import { SettingsTab } from "@/components/investor/SettingsTab";
import { MessagesTab } from "@/components/investor/MessagesTab";
import { ProfileTab } from "@/components/investor/ProfileTab";

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set active tab based on hash if present
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['discover', 'matches', 'messages', 'portfolio', 'analytics', 'profile', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search initiated",
        description: `Searching for: ${searchQuery}`,
      });
      // This would normally call the OpenAI API to process the natural language query
    } else {
      toast({
        variant: "destructive",
        title: "Search query empty",
        description: "Please enter a search term",
      });
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
    // Update URL hash when tab changes
    navigate(`/investor#${tab}`, { replace: true });
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
              <p className="text-muted-foreground mt-1">Welcome back, Alex Morgan</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
              </button>
            </div>
          </div>
          
          {/* AI Search */}
          <div className="glass-card rounded-lg p-4 mb-8 animate-fade-in">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search startups using natural language, e.g. 'Series A startup in Africa working on AI for healthcare'"
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
          
          {/* Dashboard Tabs */}
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "discover", label: "Discover Startups", icon: <Globe size={16} /> },
                { id: "matches", label: "My Matches", icon: <ThumbsUp size={16} /> },
                { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
                { id: "portfolio", label: "Portfolio", icon: <Briefcase size={16} /> },
                { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
                { id: "profile", label: "My Profile", icon: <User size={16} /> },
                { id: "settings", label: "Settings", icon: <Settings size={16} /> },
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
            {activeTab === "discover" && <DiscoverTab />}
            {activeTab === "matches" && <MatchesTab />}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "portfolio" && <PortfolioTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InvestorDashboard;
