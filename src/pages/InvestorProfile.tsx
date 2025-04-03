
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/investor/ProfileTab";
import { useState, useEffect } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { DashboardRightSidebar } from "@/components/shared/DashboardRightSidebar";
import { supabase } from "@/lib/supabase";

const InvestorProfile = () => {
  console.log("Rendering InvestorProfile");
  
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [userName, setUserName] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  // If no profileId is provided, use the current user's ID
  const currentProfileId = profileId || user?.id;

  console.log("InvestorProfile - profileId:", profileId, "user?.id:", user?.id, "currentProfileId:", currentProfileId);

  // Redirect unauthenticated users to login
  useEffect(() => {
    console.log("InvestorProfile useEffect - user:", !!user, "profileId:", profileId);
    
    if (!user && !profileId) {
      console.log("No user and no profileId, redirecting to auth");
      navigate('/auth');
    } else if (user) {
      // If we're on the profile page, fetch user data
      console.log("Fetching user profile for:", user.id);
      const fetchUserProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, verified')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user profile:", error);
            throw error;
          }
          
          console.log("Profile data:", data);
          
          if (data) {
            setUserName(data.name || "Investor User");
            setIsVerified(!!data.verified);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };
      
      fetchUserProfile();
    }
  }, [user, profileId, navigate]);

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
                userType="investor"
                isVerified={isVerified}
              />
            </div>

            {/* Main content */}
            <div className="col-span-14 md:col-span-8">
              <h1 className="text-2xl font-bold mb-8">Investor Profile</h1>
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

export default InvestorProfile;
