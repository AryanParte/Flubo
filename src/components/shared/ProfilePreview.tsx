
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Mail, MapPin, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useFollowUser } from "@/hooks/useFollowUser";
import { Loader2 } from "lucide-react";

interface ProfilePreviewProps {
  userId: string;
}

export function ProfilePreview({ userId }: ProfilePreviewProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { 
    isFollowing, 
    isLoading, 
    followersCount, 
    followingCount, 
    followUser, 
    unfollowUser, 
    loadFollowData 
  } = useFollowUser();
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Fetch basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        // Check user type and fetch additional data
        let additionalData = {};
        if (profileData.user_type === "startup") {
          const { data: startupData, error: startupError } = await supabase
            .from("startup_profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (!startupError && startupData) {
            additionalData = { ...startupData };
          }
        }

        setProfile({ ...profileData, ...additionalData });
        
        // Load follow data
        await loadFollowData(userId);
      } catch (error) {
        console.error("Error in fetchProfileData:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.avatar || "/placeholder.svg"} />
            <AvatarFallback>{profile.name ? profile.name.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-xl">{profile.name}</h3>
            <p className="text-muted-foreground">{profile.user_type === "startup" ? "Business" : "Investor"}</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {profile.company && (
            <p className="text-sm">{profile.position} at {profile.company}</p>
          )}
          
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
          
          {profile.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{profile.location}</span>
            </div>
          )}
          
          {profile.created_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
          
          {profile.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 mr-1" />
              <span>{profile.email}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm mb-3">
          <div className="flex items-center">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span><strong>{followersCount}</strong> followers</span>
          </div>
          <div>
            <span><strong>{followingCount}</strong> following</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-3 border-t flex justify-between">
        {user && user.id !== userId && (
          <Button 
            variant={isFollowing ? "outline" : "default"} 
            size="sm" 
            className="w-full"
            onClick={handleFollow}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : isFollowing ? (
              "Unfollow"
            ) : (
              "Follow"
            )}
          </Button>
        )}
        
        {(!user || user.id === userId) && (
          <Button variant="outline" size="sm" className="w-full" disabled>
            {user && user.id === userId ? "Your Profile" : "Sign in to follow"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
