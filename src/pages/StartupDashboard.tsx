
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/startup/OverviewTab";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { MatchesTab } from "@/components/startup/MatchesTab";
import { MessagesTab } from "@/components/startup/MessagesTab";
import { FindInvestorsTab } from "@/components/startup/FindInvestorsTab";
import { FindCompaniesTab } from "@/components/startup/FindCompaniesTab";
import { VerificationOnboarding } from "@/components/startup/VerificationOnboarding";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessagesSquare, 
  Search, 
  UserCircle, 
  Settings, 
  BookMarked,
  Building2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { UserAvatar } from "@/components/shared/UserAvatar";

const StartupDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showVerification, setShowVerification] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // Update URL without refreshing page
    window.history.pushState({}, "", `/business${tab !== "overview" ? `/${tab}` : ""}`);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            throw profileError;
          }
          
          if (profileData) {
            console.log("Profile data loaded:", profileData);
            setProfile(profileData);
            
            // Check if verification reminder should be shown
            setShowVerification(!profileData.verified);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProfile();
    }

    // Parse the current URL to set the active tab
    const path = window.location.pathname;
    const pathParts = path.split('/');
    if (pathParts.length > 2) {
      setActiveTab(pathParts[2]);
    }
  }, [user, navigate]);

  const handleAvatarUpdate = (url: string) => {
    setProfile({
      ...profile,
      avatar_url: url
    });
  };

  if (!user) return null;

  return (
    <div className="container py-8">
      {showVerification && <VerificationOnboarding />}
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
        <div className="flex items-center gap-4">
          <UserAvatar 
            userId={user.id} 
            avatarUrl={profile?.avatar_url}
            name={profile?.company || profile?.name}
            size="lg"
            editable={true}
            onAvatarUpdate={handleAvatarUpdate}
          />
          <div>
            {profile?.company ? (
              <h1 className="text-2xl font-bold">{profile.company}</h1>
            ) : (
              <h1 className="text-2xl font-bold">{profile?.name}</h1>
            )}
            <p className="text-muted-foreground">{profile?.position || 'Startup'}</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={() => navigate("/settings/startup")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Card className="mx-auto mt-6">
        <CardHeader className="pb-0">
          <CardTitle className="sr-only">Dashboard Tabs</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs defaultValue={activeTab} value={activeTab} className="w-full mx-auto" onValueChange={handleTabClick}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
              
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              
              <TabsTrigger value="investors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Find Investors</span>
                <span className="sm:hidden">Investors</span>
              </TabsTrigger>
              
              <TabsTrigger value="companies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Building2 className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Find Companies</span>
                <span className="sm:hidden">Companies</span>
              </TabsTrigger>
              
              <TabsTrigger value="matches" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookMarked className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Matches</span>
                <span className="sm:hidden">Matches</span>
              </TabsTrigger>
              
              <TabsTrigger value="messages" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessagesSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                <span className="sm:hidden">Chat</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="pt-6">
              <OverviewTab />
            </TabsContent>
            
            <TabsContent value="profile" className="pt-6">
              <ProfileTab />
            </TabsContent>
            
            <TabsContent value="investors" className="pt-6">
              <FindInvestorsTab />
            </TabsContent>
            
            <TabsContent value="companies" className="pt-6">
              <FindCompaniesTab />
            </TabsContent>
            
            <TabsContent value="matches" className="pt-6">
              <MatchesTab />
            </TabsContent>
            
            <TabsContent value="messages" className="pt-6">
              <MessagesTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartupDashboard;
