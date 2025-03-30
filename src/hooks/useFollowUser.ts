
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export function useFollowUser() {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  const checkFollowStatus = async (userId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error in checkFollowStatus:', error);
      return false;
    }
  };

  const getFollowCounts = async (userId: string) => {
    try {
      // Get followers count
      const { data: followersData, error: followersError } = await supabase
        .rpc('get_followers_count', { user_id: userId });
      
      if (followersError) {
        console.error('Error getting followers count:', followersError);
      } else if (followersData !== null) {
        setFollowersCount(followersData);
      }
      
      // Get following count
      const { data: followingData, error: followingError } = await supabase
        .rpc('get_following_count', { user_id: userId });
      
      if (followingError) {
        console.error('Error getting following count:', followingError);
      } else if (followingData !== null) {
        setFollowingCount(followingData);
      }
    } catch (error) {
      console.error('Error getting follow counts:', error);
    }
  };

  const loadFollowData = async (userId: string) => {
    if (!user || !userId) return;
    
    const status = await checkFollowStatus(userId);
    setIsFollowing(status);
    await getFollowCounts(userId);
  };

  const followUser = async (userId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    if (user.id === userId) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own account",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: userId
        });
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already following",
            description: "You are already following this user",
          });
        } else {
          console.error('Error following user:', error);
          toast({
            title: "Error",
            description: "Failed to follow user. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({
          title: "Success",
          description: "You are now following this user",
        });
      }
    } catch (error) {
      console.error('Error in followUser:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      
      if (error) {
        console.error('Error unfollowing user:', error);
        toast({
          title: "Error",
          description: "Failed to unfollow user. Please try again.",
          variant: "destructive",
        });
      } else {
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Success",
          description: "You have unfollowed this user",
        });
      }
    } catch (error) {
      console.error('Error in unfollowUser:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    followersCount,
    followingCount,
    followUser,
    unfollowUser,
    loadFollowData,
    getFollowCounts
  };
}
