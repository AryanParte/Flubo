
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Mail, MapPin, MoreHorizontal, UserPlus, UserCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface ProfilePreviewProps {
  userId: string;
}

type ProfileData = {
  id: string;
  name: string | null;
  email: string | null;
  user_type: string | null;
  created_at: string | null;
  company: string | null;
  position: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
};

export function ProfilePreview({ userId }: ProfilePreviewProps) {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch the profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        // Fetch followers count
        const { count: followersCount, error: followersError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
          
        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
          
        // Fetch posts count
        const { count: postsCount, error: postsError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        // Check if current user is following this profile
        if (user) {
          const { data: followData, error: followError } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();
            
          setIsFollowing(!!followData);
        }
        
        setProfileData({
          ...data,
          followers_count: followersCount || 0,
          following_count: followingCount || 0,
          posts_count: postsCount || 0,
        });
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchProfileData();
    }
  }, [userId, user]);
  
  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        setIsFollowing(false);
        
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${profileData?.name || 'this user'}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId,
          });
          
        if (error) throw error;
        setIsFollowing(true);
        
        toast({
          title: "Following",
          description: `You are now following ${profileData?.name || 'this user'}`,
        });
      }
      
      // Update follower count
      if (profileData) {
        setProfileData({
          ...profileData,
          followers_count: isFollowing ? 
            profileData.followers_count - 1 : 
            profileData.followers_count + 1
        });
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center space-y-4 min-w-[300px]">
        <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
        <div className="w-3/4 h-4 bg-muted animate-pulse rounded" />
        <div className="w-1/2 h-3 bg-muted animate-pulse rounded" />
        <div className="w-full h-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }
  
  if (!profileData) {
    return (
      <div className="p-4 text-center">
        <p>Profile not found</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 min-w-[300px]">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profileData.avatar_url || undefined} />
            <AvatarFallback>{profileData.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{profileData.name}</h3>
            <Badge variant="outline" className="mt-1">
              {profileData.user_type === 'startup' ? 'Business' : 'Investor'}
            </Badge>
            {profileData.position && (
              <p className="text-sm text-muted-foreground mt-1">{profileData.position}</p>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {profileData.id !== user?.id && (
            <Button 
              size="sm" 
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollowToggle}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {profileData.bio && (
        <p className="text-sm mt-3">{profileData.bio}</p>
      )}
      
      {profileData.company && (
        <p className="text-sm text-muted-foreground mt-2">
          {profileData.company}
        </p>
      )}
      
      {profileData.location && (
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 mr-1" />
          {profileData.location}
        </div>
      )}
      
      <div className="flex justify-between mt-4">
        <div className="text-center">
          <p className="font-medium">{profileData.posts_count}</p>
          <p className="text-xs text-muted-foreground">Posts</p>
        </div>
        <div className="text-center">
          <p className="font-medium">{profileData.followers_count}</p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </div>
        <div className="text-center">
          <p className="font-medium">{profileData.following_count}</p>
          <p className="text-xs text-muted-foreground">Following</p>
        </div>
      </div>
      
      <Separator className="my-3" />
      
      <div className="flex justify-center space-x-2">
        <Button size="sm" variant="outline">
          <Mail className="h-4 w-4 mr-1" />
          Message
        </Button>
        <Button size="sm" variant="outline">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
