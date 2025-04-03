
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { useState, useEffect } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { DashboardRightSidebar } from "@/components/shared/DashboardRightSidebar";
import { supabase } from "@/lib/supabase";

const StartupProfile = () => {
  console.log("Rendering StartupProfile");
  
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [userName, setUserName] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [lookingForFunding, setLookingForFunding] = useState(true);
  const [lookingForDesignPartner, setLookingForDesignPartner] = useState(false);

  // If no profileId is provided, use the current user's ID
  const currentProfileId = profileId || user?.id;
  
  console.log("StartupProfile - location:", location.pathname);
  console.log("StartupProfile - profileId:", profileId, "user?.id:", user?.id, "currentProfileId:", currentProfileId);

  // Fetch user profile data without redirects
  useEffect(() => {
    console.log("StartupProfile useEffect - user:", !!user, "profileId:", profileId);
    
    // Only redirect if no user and no profile ID
    if (!user && !profileId) {
      console.log("No user and no profileId, redirecting to auth");
      navigate('/auth');
      return;
    }
    
    // Fetch user data without any redirections
    const fetchUserProfile = async () => {
      try {
        const targetId = profileId || user?.id;
        console.log("Fetching user profile for:", targetId);
        
        if (!targetId) return;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('name, verified, looking_for_funding, looking_for_design')
          .eq('id', targetId)
          .single();
          
        if (error) {
          console.error("Error fetching user profile:", error);
          throw error;
        }
        
        console.log("Profile data:", data);
        
        if (data) {
          setUserName(data.name || "Startup User");
          setIsVerified(!!data.verified);
          setLookingForFunding(data.looking_for_funding ?? true);
          setLookingForDesignPartner(data.looking_for_design ?? false);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    
    fetchUserProfile();
  }, [user, profileId, navigate]);

  const handleFundingToggle = async (checked: boolean) => {
    setLookingForFunding(checked);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ looking_for_funding: checked })
          .eq('id', user.id);
          
        if (error) throw error;
      } catch (error) {
        console.error("Error updating funding status:", error);
      }
    }
  };
  
  const handleDesignToggle = async (checked: boolean) => {
    setLookingForDesignPartner(checked);
    
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ looking_for_design: checked })
          .eq('id', user.id);
          
        if (error) throw error;
      } catch (error) {
        console.error("Error updating design partner status:", error);
      }
    }
  };

  const handleShowFollowers = () => {
    console.log("Opening followers modal");
    setShowFollowers(true);
  };

  const handleShowFollowing = () => {
    console.log("Opening following modal");
    setShowFollowing(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-14 gap-6">
            {/* Left sidebar */}
            <div className="col-span-14 md:col-span-3">
              <DashboardSidebar
                userName={userName}
                userType="startup"
                isVerified={isVerified}
                lookingForFunding={lookingForFunding}
                onFundingToggle={handleFundingToggle}
                lookingForDesignPartner={lookingForDesignPartner}
                onDesignToggle={handleDesignToggle}
              />
            </div>

            {/* Main content */}
            <div className="col-span-14 md:col-span-8">
              <h1 className="text-2xl font-bold mb-8">Business Profile</h1>
              <ProfileTab 
                onShowFollowers={handleShowFollowers}
                onShowFollowing={handleShowFollowing}
              />
            </div>

            {/* Right sidebar */}
            <div className="col-span-14 md:col-span-3">
              <DashboardRightSidebar />
            </div>
          </div>
        </div>
      </main>
      <MinimalFooter />

      {currentProfileId && (
        <>
          <UserListModal
            open={showFollowers}
            onOpenChange={setShowFollowers}
            title="Followers"
            userId={currentProfileId}
            type="followers"
          />
          
          <UserListModal
            open={showFollowing}
            onOpenChange={setShowFollowing}
            title="Following"
            userId={currentProfileId}
            type="following"
          />
        </>
      )}
    </div>
  );
};

export default StartupProfile;
