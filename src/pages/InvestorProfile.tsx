
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/investor/ProfileTab";
import { useState, useEffect } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/shared/DashboardSidebar";
import { DashboardRightSidebar } from "@/components/shared/DashboardRightSidebar";

const InvestorProfile = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // If no profileId is provided, use the current user's ID
  const currentProfileId = profileId || user?.id;

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user && !profileId) {
      navigate('/auth');
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
                userName="Investor User"
                userType="investor"
                isVerified={false}
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
