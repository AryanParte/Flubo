
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Users, MessageSquare, BarChart3, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

// Import tab components
import { OverviewTab } from "@/components/startup/OverviewTab";
import { MatchesTab } from "@/components/startup/MatchesTab";
import { MessagesTab } from "@/components/startup/MessagesTab";
import { SettingsTab } from "@/components/startup/SettingsTab";
import { ProfileTab } from "@/components/startup/ProfileTab";

const StartupDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Set active tab based on hash if present
  useState(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['overview', 'matches', 'messages', 'settings', 'profile'].includes(hash)) {
      setActiveTab(hash);
    }
  });
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL hash when tab changes
    navigate(`/startup#${tab}`, { replace: true });
  };

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "You have 2 unread notifications",
    });
  };

  const handleCompleteProfileClick = () => {
    setActiveTab("profile");
    navigate('/startup#profile', { replace: true });
  };
  
  // Render the appropriate tab content based on activeTab
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "matches":
        return <MatchesTab />;
      case "messages":
        return <MessagesTab />;
      case "settings":
        return <SettingsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <OverviewTab />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Startup Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, TechNova</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
              </button>
              
              <button 
                className="flex items-center space-x-2 py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-sm"
                onClick={handleCompleteProfileClick}
              >
                <span>Complete Your Profile</span>
              </button>
            </div>
          </div>
          
          {/* Dashboard Tabs */}
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
                { id: "matches", label: "Investor Matches", icon: <Users size={16} /> },
                { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
                { id: "profile", label: "Company Profile", icon: <User size={16} /> },
                { id: "settings", label: "Settings", icon: <Settings size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Dashboard Content - Render the appropriate tab */}
          {renderTabContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupDashboard;
