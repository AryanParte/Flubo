
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [error, setError] = useState<string | null>(null);
  const { isFollowing, followUser, unfollowUser, loadFollowData } = useFollowUser();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  
  // Debug the modal state and userId
  useEffect(() => {
    console.log(`UserListModal - open: ${open}, userId: ${userId}, type: ${type}`);
  }, [open, userId, type]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);
  
  // Only fetch users when modal is open AND we have a userId
  useEffect(() => {
    if (open) {
      if (userId && userId.length > 0) {
        console.log(`Modal opened for ${type}, fetching users for ID: ${userId}`);
        setLoading(true);
        setError(null);
        fetchUsers();
      } else {
        console.error("Cannot fetch users: userId is empty");
        setError("User ID is not available");
        setLoading(false);
      }
    }
  }, [open, userId, type]);
  
  const fetchUsers = async () => {
    if (!userId || userId.length === 0) {
      console.error("Cannot fetch users: userId is empty");
      setError("User ID is not available");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let usersData = [];
      
      if (type === "followers") {
        // Get users who follow this user
        const { data, error } = await supabase
          .from('followers')
          .select('follower_id')
          .eq('following_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Fetch profiles for all follower_ids
          const followerIds = data.map(item => item.follower_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', followerIds);
            
          if (profilesError) throw profilesError;
          usersData = profilesData || [];
        }
      } else {
        // Get users this user follows
        const { data, error } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Fetch profiles for all following_ids
          const followingIds = data.map(item => item.following_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', followingIds);
            
          if (profilesError) throw profilesError;
          usersData = profilesData || [];
        }
      }
      
      console.log("Fetched users data:", usersData);
      setUsers(usersData || []);
      setError(null);
      
      // Initialize follow status for each user
      const statuses: Record<string, boolean> = {};
      const loadingStatus: Record<string, boolean> = {};
      
      if (user) {
        for (const userProfile of usersData || []) {
          if (userProfile.id === user.id) continue;
          statuses[userProfile.id] = false;
          loadingStatus[userProfile.id] = false;
          
          // Check follow status
          const { data: followData } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userProfile.id)
            .maybeSingle();
            
          statuses[userProfile.id] = !!followData;
        }
      }
      
      setFollowStatus(statuses);
      setFollowLoading(loadingStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load user list. Please try again.");
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

  console.log("UserListModal render state:", { open, userId, type, usersCount: users.length, error });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            People {type === 'followers' ? 'following this profile' : 'that this profile follows'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto py-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-red-500">{error}</p>
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
                      {userItem.avatar_url && (
                        <AvatarImage src={userItem.avatar_url} alt={userItem.name} />
                      )}
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
