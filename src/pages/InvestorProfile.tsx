
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/investor/ProfileTab";
import { useState } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams } from "react-router-dom";

const InvestorProfile = () => {
  const { id: profileId } = useParams();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const handleShowFollowers = () => {
    console.log("Opening followers modal from InvestorProfile");
    setShowFollowers(true);
  };

  const handleShowFollowing = () => {
    console.log("Opening following modal from InvestorProfile");
    setShowFollowing(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold mb-8">Investor Profile</h1>
          <ProfileTab 
            onShowFollowers={handleShowFollowers}
            onShowFollowing={handleShowFollowing}
          />
        </div>
      </main>
      <MinimalFooter />

      {profileId && (
        <>
          <UserListModal
            open={showFollowers}
            onOpenChange={setShowFollowers}
            title="Followers"
            userId={profileId}
            type="followers"
          />
          
          <UserListModal
            open={showFollowing}
            onOpenChange={setShowFollowing}
            title="Following"
            userId={profileId}
            type="following"
          />
        </>
      )}
    </div>
  );
};

export default InvestorProfile;
