
import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building, Users, Briefcase, DollarSign, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Investor } from "@/types/investor";
import { useFollowUser } from "@/hooks/useFollowUser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { ProfilePreview } from "@/components/shared/ProfilePreview";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvestorProfilePopupProps {
  investor: Investor;
}

export const InvestorProfilePopup = ({ investor }: InvestorProfilePopupProps) => {
  const { user } = useAuth();
  const [showFullProfile, setShowFullProfile] = useState(false);
  const { isFollowing, isLoading, followersCount, followingCount, followUser, unfollowUser, loadFollowData } = useFollowUser();
  
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
              <Avatar className="h-12 w-12">
                <AvatarFallback>{investor.name?.charAt(0) || 'I'}</AvatarFallback>
                {investor.avatar_url && <AvatarImage src={investor.avatar_url} />}
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold">{investor.name}</h4>
                <p className="text-xs text-muted-foreground">{investor.role} at {investor.company}</p>
              </div>
            </div>
          </div>
          
          {investor.bio && (
            <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{investor.bio}</p>
          )}
          
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
          
          {investor.preferred_stages && investor.preferred_stages.length > 0 && (
            <div className="mt-1 flex items-start text-xs text-muted-foreground">
              <Briefcase className="h-3 w-3 mr-1 mt-0.5" />
              <span>Stages: {investor.preferred_stages.join(", ")}</span>
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
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Investor Profile</DialogTitle>
          </DialogHeader>
          <ProfilePreview userId={investor.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};
