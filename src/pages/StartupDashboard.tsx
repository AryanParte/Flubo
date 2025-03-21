import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Users, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

// Import tab components
import { OverviewTab } from "@/components/startup/OverviewTab";
import { MatchesTab } from "@/components/startup/MatchesTab";
import { SettingsTab } from "@/components/startup/SettingsTab";

const StartupDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [startupName, setStartupName] = useState("Your Startup");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchStartupData();
      checkProfileCompletion();
      countUnreadNotifications();
    }
  }, [user]);

  const fetchStartupData = async () => {
    try {
      // First check if we have a startup_profile
      const { data: startupProfile, error: startupError } = await supabase
        .from('startup_profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      
      if (startupError) throw startupError;
      
      if (startupProfile?.name) {
        setStartupName(startupProfile.name);
      } else {
        // Fallback to the regular profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        if (profile?.name) {
          setStartupName(profile.name);
        }
      }
    } catch (error) {
      console.error("Error fetching startup data:", error);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      // Check if we have at least a startup profile
      const { data: startupProfile, error } = await supabase
        .from('startup_profiles')
        .select('bio')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Consider profile complete if we have a startup profile with bio
      setProfileComplete(!!startupProfile?.bio);
    } catch (error) {
      console.error("Error checking profile completion:", error);
    }
  };

  const countUnreadNotifications = async () => {
    try {
      // Count unread messages
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', user.id)
        .is('read_at', null);
        
      if (error) throw error;
      
      setUnreadNotifications(data?.length || 0);
    } catch (error) {
      console.error("Error counting notifications:", error);
      // If there's an error, set a default value
      setUnreadNotifications(0);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: `You have ${unreadNotifications} unread notifications`,
    });
  };

  const handleCompleteProfileClick = () => {
    navigate('/startup/profile');
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "matches":
        return <MatchesTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <OverviewTab />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Startup Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {startupName}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
                )}
              </button>
              
              {!profileComplete && (
                <button 
                  className="flex items-center space-x-2 py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-sm"
                  onClick={handleCompleteProfileClick}
                >
                  <span>Complete Your Profile</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
                { id: "matches", label: "Investor Matches", icon: <Users size={16} /> },
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
          
          {renderTabContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupDashboard;
