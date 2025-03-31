
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, MapPin, Users, Briefcase, Building, DollarSign, Link } from "lucide-react";
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
  const [investorPreferences, setInvestorPreferences] = useState<any>(null);
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
        } else if (profileData.user_type === "investor") {
          // Fetch investor preferences
          const { data: investorPrefs, error: investorError } = await supabase
            .from("investor_preferences")
            .select("*")
            .eq("user_id", userId)
            .single();
            
          if (!investorError && investorPrefs) {
            setInvestorPreferences(investorPrefs);
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

  const isInvestor = profile.user_type === "investor";

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar || "/placeholder.svg"} />
            <AvatarFallback>{profile.name ? profile.name.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-xl">{profile.name}</h3>
            <p className="text-muted-foreground capitalize">{profile.user_type}</p>
            {profile.position && profile.company && (
              <p className="text-sm mt-1">{profile.position} at {profile.company}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-3 mb-5">
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
          
          {profile.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-2" />
              <span>{profile.location}</span>
            </div>
          )}
          
          {profile.created_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-2" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          )}
          
          {profile.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 mr-2" />
              <span>{profile.email}</span>
            </div>
          )}
          
          {isInvestor && (
            <>
              {investorPreferences?.preferred_sectors && investorPreferences.preferred_sectors.length > 0 && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <Building className="h-3.5 w-3.5 mr-2 mt-0.5" />
                  <div>
                    <span className="block font-medium text-foreground mb-1">Industry Focus</span>
                    <div className="flex flex-wrap gap-1">
                      {investorPreferences.preferred_sectors.map((sector: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {investorPreferences?.preferred_stages && investorPreferences.preferred_stages.length > 0 && (
                <div className="flex items-start text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 mr-2 mt-0.5" />
                  <div>
                    <span className="block font-medium text-foreground mb-1">Investment Stages</span>
                    <div className="flex flex-wrap gap-1">
                      {investorPreferences.preferred_stages.map((stage: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {(investorPreferences?.min_investment || investorPreferences?.max_investment) && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 mr-2" />
                  <span>
                    <span className="font-medium text-foreground">Investment Range: </span>
                    {investorPreferences.min_investment && investorPreferences.max_investment 
                      ? `${investorPreferences.min_investment} - ${investorPreferences.max_investment}`
                      : investorPreferences.min_investment 
                        ? `${investorPreferences.min_investment}+` 
                        : `Up to ${investorPreferences.max_investment}`
                    }
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* Startup-specific fields */}
          {profile.user_type === "startup" && (
            <>
              {profile.stage && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 mr-2" />
                  <span>
                    <span className="font-medium text-foreground">Stage: </span>
                    {profile.stage}
                  </span>
                </div>
              )}
              
              {profile.industry && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-3.5 w-3.5 mr-2" />
                  <span>
                    <span className="font-medium text-foreground">Industry: </span>
                    {profile.industry}
                  </span>
                </div>
              )}
              
              {profile.website && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Link className="h-3.5 w-3.5 mr-2" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </>
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
