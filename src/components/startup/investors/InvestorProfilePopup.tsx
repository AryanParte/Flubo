
import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building, Users, Briefcase, DollarSign, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Investor } from "@/types/investor";
import { useFollowUser } from "@/hooks/useFollowUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface InvestorProfilePopupProps {
  investor: Investor;
}

export const InvestorProfilePopup = ({ investor }: InvestorProfilePopupProps) => {
  const { user } = useAuth();
  const [showFullProfile, setShowFullProfile] = useState(false);
  const { isFollowing, isLoading, followersCount, followingCount, followUser, unfollowUser, loadFollowData } = useFollowUser();
  const [completeProfile, setCompleteProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (investor?.id) {
      loadFollowData(investor.id);
    }
  }, [investor?.id]);
  
  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowUser(investor.id);
    } else {
      await followUser(investor.id);
    }
  };
  
  const fetchCompleteProfile = async () => {
    if (!investor.id || loading) return;
    
    setLoading(true);
    try {
      // Fetch the basic profile information
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", investor.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Fetch the investor preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from("investor_preferences")
        .select("*")
        .eq("user_id", investor.id)
        .maybeSingle();
        
      if (preferencesError) throw preferencesError;
      
      // Combine the data
      setCompleteProfile({
        ...profileData,
        preferences: preferencesData || {},
      });
      
    } catch (error) {
      console.error("Error fetching complete investor profile:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch complete profile when dialog opens
  useEffect(() => {
    if (showFullProfile && !completeProfile) {
      fetchCompleteProfile();
    }
  }, [showFullProfile]);
  
  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="font-medium cursor-pointer hover:underline" onClick={() => setShowFullProfile(true)}>
            {investor.name}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{investor.name?.charAt(0) || 'I'}</AvatarFallback>
                {investor.avatar_url && <AvatarImage src={investor.avatar_url} />}
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold">{investor.name}</h4>
                <p className="text-xs text-muted-foreground">{investor.role} at {investor.company}</p>
              </div>
            </div>
          </div>
          
          {investor.location && (
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{investor.location}</span>
            </div>
          )}
          
          {investor.industry && (
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <Building className="h-3 w-3 mr-1" />
              <span>{investor.industry}</span>
            </div>
          )}
          
          {investor.investment_size && (
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>Investment: {investor.investment_size}</span>
            </div>
          )}
          
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <Users className="h-3 w-3 mr-1" />
            <span>{followersCount} followers · {followingCount} following</span>
          </div>
          
          {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Interested in:</p>
              <div className="flex flex-wrap gap-1">
                {investor.preferred_sectors.map((sector, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 flex justify-between">
            <Button 
              size="sm" 
              variant={isFollowing ? "outline" : "default"}
              className="w-full text-xs"
              onClick={handleFollow}
              disabled={isLoading || !user}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : isFollowing ? (
                "Unfollow"
              ) : (
                "Follow"
              )}
            </Button>
          </div>
          
          <Button 
            variant="link" 
            size="sm" 
            className="w-full mt-1 text-xs"
            onClick={() => setShowFullProfile(true)}
          >
            View full profile
          </Button>
        </HoverCardContent>
      </HoverCard>
      
      <Dialog open={showFullProfile} onOpenChange={setShowFullProfile}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Investor Profile</DialogTitle>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Header */}
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24 rounded-lg">
                  <AvatarFallback className="text-2xl bg-accent/10 text-accent">
                    {investor.name ? investor.name.charAt(0) : "I"}
                  </AvatarFallback>
                  {investor.avatar_url && <AvatarImage src={investor.avatar_url} />}
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{investor.name}</h1>
                  <p className="text-lg text-muted-foreground">
                    {completeProfile?.position || investor.role} at {completeProfile?.company || investor.company}
                  </p>
                  
                  <div className="mt-2 space-y-1">
                    {investor.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{investor.location}</span>
                      </div>
                    )}
                    
                    {completeProfile?.email && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <LinkIcon className="h-4 w-4 mr-2" />
                        <span>{completeProfile.email}</span>
                      </div>
                    )}
                    
                    {completeProfile?.created_at && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Joined {new Date(completeProfile.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-6">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm"><strong>{followersCount}</strong> followers</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm"><strong>{followingCount}</strong> following</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="ml-auto"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={isLoading || !user}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : isFollowing ? (
                    "Unfollow"
                  ) : (
                    "Follow"
                  )}
                </Button>
              </div>
              
              {/* Investment Criteria */}
              <div className="glass-card p-6 rounded-lg border border-border/50">
                <h2 className="text-lg font-semibold mb-4">Investment Criteria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Investment Size</h3>
                    <p className="mt-1">
                      {investor.investment_size || 
                       (completeProfile?.preferences?.min_investment && 
                        completeProfile?.preferences?.max_investment ? 
                        `${completeProfile.preferences.min_investment} - ${completeProfile.preferences.max_investment}` : 
                        "Not specified")}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Preferred Stages</h3>
                    <p className="mt-1">
                      {investor.preferred_stages?.length > 0 ? 
                        investor.preferred_stages.join(", ") : 
                        completeProfile?.preferences?.preferred_stages?.join(", ") || 
                        "Not specified"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Industry Focus</h3>
                    <p className="mt-1">
                      {investor.industry || "Technology"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Preferred Sectors</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(investor.preferred_sectors?.length > 0 ? 
                        investor.preferred_sectors : 
                        completeProfile?.preferences?.preferred_sectors || 
                        []).map((sector: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bio Section */}
              <div className="glass-card p-6 rounded-lg border border-border/50">
                <h2 className="text-lg font-semibold mb-4">About</h2>
                <p>{investor.bio || "Angel investor with a focus on early-stage startups in technology and innovation."}</p>
              </div>
              
              {/* Investment Portfolio */}
              <div className="glass-card p-6 rounded-lg border border-border/50">
                <h2 className="text-lg font-semibold mb-4">Investment Portfolio</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h3 className="text-sm font-medium text-muted-foreground">Active Investments</h3>
                    <p className="text-2xl font-bold mt-1">14</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h3 className="text-sm font-medium text-muted-foreground">Exits</h3>
                    <p className="text-2xl font-bold mt-1">6</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background/50 border border-border/30">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Deployed</h3>
                    <p className="text-2xl font-bold mt-1">$28M</p>
                  </div>
                </div>
              </div>
              
              {/* Investment Preferences */}
              <div className="glass-card p-6 rounded-lg border border-border/50">
                <h2 className="text-lg font-semibold mb-4">Investment Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Founder Background</h3>
                    <p className="mt-1">Technical founders with domain expertise. Value previous startup experience.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Business Model</h3>
                    <p className="mt-1">B2B SaaS with recurring revenue. Looking for capital-efficient businesses with clear paths to profitability.</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Preference</h3>
                    <p className="mt-1">Prefer warm introductions, but open to cold outreach with a clear and concise pitch.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
