
import { InvestorList } from "./investors/InvestorList";
import { UserListModal } from "@/components/shared/UserListModal";
import { useState } from "react";

export const FindInvestorsTab = () => {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const handleShowFollowers = (userId: string) => {
    setSelectedUserId(userId);
    setShowFollowers(true);
  };

  const handleShowFollowing = (userId: string) => {
    setSelectedUserId(userId);
    setShowFollowing(true);
  };
  
  return (
    <div className="p-6">
      <InvestorList 
        showSearch={true} 
        showTabs={true} 
        onShowFollowers={handleShowFollowers}
        onShowFollowing={handleShowFollowing}
      />
      
      {selectedUserId && (
        <>
          <UserListModal
            open={showFollowers}
            onOpenChange={setShowFollowers}
            title="Followers"
            userId={selectedUserId}
            type="followers"
          />
          
          <UserListModal
            open={showFollowing}
            onOpenChange={setShowFollowing}
            title="Following"
            userId={selectedUserId}
            type="following"
          />
        </>
      )}
    </div>
  );
};
