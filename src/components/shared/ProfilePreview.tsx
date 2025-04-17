import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  Mail, 
  MapPin, 
  Users, 
  Building, 
  Briefcase, 
  Globe, 
  DollarSign, 
  Tags, 
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useFollowUser } from "@/hooks/useFollowUser";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";

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
        if (profileData.user_type === "investor") {
          // Fetch investor preferences
          const { data: investorPrefs, error: prefsError } = await supabase
            .from("investor_preferences")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (!prefsError && investorPrefs) {
            additionalData = { 
              investor_preferences: investorPrefs 
            };
          }
        } else if (profileData.user_type === "startup") {
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

  const isInvestor = profile.user_type === "investor";
  const preferences = profile.investor_preferences || {};

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{profile.name ? profile.name.charAt(0) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-xl flex items-center gap-1.5">
                {profile.name}
                <AccountVerificationBadge verified={profile.verified} userId={profile.id} />
              </h3>
              <p className="text-muted-foreground">{profile.user_type === "startup" ? "Business" : "Investor"}</p>
              
              {profile.company && (
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.position} at {profile.company}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm mb-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span><strong>{followersCount}</strong> followers</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span><strong>{followingCount}</strong> following</span>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {profile.bio && (
              <p className="text-sm">{profile.bio}</p>
            )}
            
            {profile.location && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{profile.location}</span>
              </div>
            )}
            
            {profile.created_at && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
            
            {profile.email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t flex justify-between">
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
      
      {/* Additional Investor Information */}
      {isInvestor && (
        <>
          {/* Investment Criteria */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Investment Criteria</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {preferences.min_investment && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Investment Range</h4>
                    <p className="mt-1">
                      {preferences.min_investment}
                      {preferences.max_investment && ` - ${preferences.max_investment}`}
                    </p>
                  </div>
                )}
                
                {preferences.preferred_stages && preferences.preferred_stages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Preferred Stages</h4>
                    <p className="mt-1">{preferences.preferred_stages.join(", ")}</p>
                  </div>
                )}
                
                {preferences.preferred_sectors && preferences.preferred_sectors.length > 0 && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Focus Sectors</h4>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preferences.preferred_sectors.map((sector: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Investment Portfolio */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Investment Portfolio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-accent/5 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Active Investments</h4>
                  <p className="text-xl font-bold mt-1">14</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Exits</h4>
                  <p className="text-xl font-bold mt-1">6</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Total Deployed</h4>
                  <p className="text-xl font-bold mt-1">$28M</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Investment Preferences */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Investment Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Founder Background</h4>
                  <p className="mt-1">Technical founders with domain expertise. Value previous startup experience.</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Business Model</h4>
                  <p className="mt-1">B2B SaaS with recurring revenue. Looking for capital-efficient businesses with clear paths to profitability.</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Contact Preference</h4>
                  <p className="mt-1">Prefer warm introductions, but open to cold outreach with a clear and concise pitch.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
