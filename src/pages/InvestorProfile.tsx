
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { ProfileTab } from "@/components/investor/ProfileTab";
import { useState, useEffect } from "react";
import { UserListModal } from "@/components/shared/UserListModal";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const InvestorProfile = () => {
  const { id: urlProfileId } = useParams();
  const { user } = useAuth();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [effectiveProfileId, setEffectiveProfileId] = useState<string>("");

  // Use logged-in user's ID if no profile ID is in the URL
  useEffect(() => {
    if (urlProfileId) {
      setEffectiveProfileId(urlProfileId);
    } else if (user) {
      setEffectiveProfileId(user.id);
    }
  }, [urlProfileId, user]);

  const handleShowFollowers = () => {
    console.log("Opening followers modal from InvestorProfile");
    setShowFollowers(true);
  };

  const handleShowFollowing = () => {
    console.log("Opening following modal from InvestorProfile");
    setShowFollowing(true);
  };
  
  // Log state changes to debug modal visibility issues
  useEffect(() => {
    console.log("InvestorProfile modal states:", { 
      showFollowers, 
      showFollowing, 
      urlProfileId,
      effectiveProfileId,
      userLoggedIn: !!user
    });
  }, [showFollowers, showFollowing, urlProfileId, effectiveProfileId, user]);

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

      {/* Always render the modals but control visibility with 'open' prop */}
      <UserListModal
        open={showFollowers}
        onOpenChange={setShowFollowers}
        title="Followers"
        userId={effectiveProfileId}
        type="followers"
      />
      
      <UserListModal
        open={showFollowing}
        onOpenChange={setShowFollowing}
        title="Following"
        userId={effectiveProfileId}
        type="following"
      />
    </div>
  );
};

export default InvestorProfile;
