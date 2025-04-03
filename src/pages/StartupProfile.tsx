
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { useState } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams } from "react-router-dom";

const StartupProfile = () => {
  const { id: profileId } = useParams();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

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
          <h1 className="text-2xl font-bold mb-8">Business Profile</h1>
          <div className="bg-card rounded-md shadow-sm p-5">
            <ProfileTab 
              onShowFollowers={handleShowFollowers}
              onShowFollowing={handleShowFollowing}
            />
          </div>
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

export default StartupProfile;
