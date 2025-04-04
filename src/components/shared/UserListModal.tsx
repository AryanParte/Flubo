
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

type UserListProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  userId: string;
  type: "followers" | "following";
};

export function UserListModal({ open, onOpenChange, title, userId, type }: UserListProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isFollowing, followUser, unfollowUser, loadFollowData } = useFollowUser();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  
  // Debug the modal state and userId
  useEffect(() => {
    console.log(`UserListModal - open: ${open}, userId: ${userId}, type: ${type}`);
  }, [open, userId, type]);
  
  useEffect(() => {
    if (open && userId) {
      console.log(`Modal opened for ${type}, fetching users for ID: ${userId}`);
      fetchUsers();
    } else {
      // Reset state when modal closes
      setUsers([]);
      setFollowStatus({});
      setFollowLoading({});
    }
  }, [open, userId, type]);
  
  const fetchUsers = async () => {
    if (!userId || userId.length === 0) {
      console.error("Cannot fetch users: userId is empty");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let usersData;
      
      if (type === "followers") {
        // Get users who follow this user
        const { data, error } = await supabase
          .from('followers')
          .select(`
            follower_id,
            profiles:follower_id(id, name, user_type, company, position)
          `)
          .eq('following_id', userId);
          
        if (error) throw error;
        usersData = data.map(item => item.profiles);
      } else {
        // Get users this user follows
        const { data, error } = await supabase
          .from('followers')
          .select(`
            following_id,
            profiles:following_id(id, name, user_type, company, position)
          `)
          .eq('follower_id', userId);
          
        if (error) throw error;
        usersData = data.map(item => item.profiles);
      }
      
      console.log("Fetched users data:", usersData);
      setUsers(usersData || []);
      
      // Initialize follow status for each user
      const statuses: Record<string, boolean> = {};
      const loadingStatus: Record<string, boolean> = {};
      
      if (user) {
        for (const userData of usersData || []) {
          if (userData.id === user.id) continue;
          statuses[userData.id] = false;
          loadingStatus[userData.id] = false;
          
          // Check follow status
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userData.id)
            .maybeSingle();
            
          statuses[userData.id] = !!followData;
        }
      }
      
      setFollowStatus(statuses);
      setFollowLoading(loadingStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) return;
    
    setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      if (followStatus[targetUserId]) {
        await unfollowUser(targetUserId);
        setFollowStatus(prev => ({ ...prev, [targetUserId]: false }));
      } else {
        await followUser(targetUserId);
        setFollowStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };
  
  const getProfilePath = (userId: string, userType: string) => {
    return userType === 'startup' ? `/business/profile/${userId}` : `/investor/profile/${userId}`;
  };

  console.log("UserListModal render state:", { open, userId, type, usersCount: users.length });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "followers" ? "No followers yet" : "Not following anyone yet"}
            </div>
          ) : (
            <ul className="space-y-4">
              {users.map((userItem) => (
                <li key={userItem.id} className="flex items-center justify-between">
                  <Link 
                    to={getProfilePath(userItem.id, userItem.user_type)}
                    className="flex items-center space-x-3 flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{userItem.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {userItem.position && userItem.company 
                          ? `${userItem.position} at ${userItem.company}`
                          : userItem.user_type === 'startup' ? 'Business' : 'Investor'}
                      </p>
                    </div>
                  </Link>
                  
                  {user && user.id !== userItem.id && (
                    <Button 
                      variant={followStatus[userItem.id] ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollowToggle(userItem.id)}
                      disabled={followLoading[userItem.id]}
                    >
                      {followLoading[userItem.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : followStatus[userItem.id] ? (
                        "Unfollow"
                      ) : (
                        "Follow"
                      )}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
