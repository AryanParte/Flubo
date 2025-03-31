
import { useState } from "react";
import { Briefcase, Building, MapPin, Tags, DollarSign, Bot, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Investor } from "../../../types/investor";
import { Badge } from "@/components/ui/badge";
import { InvestorAIChat } from "./InvestorAIChat";
import { InvestorProfilePopup } from "./InvestorProfilePopup";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InvestorCardProps {
  investor: Investor;
}

export const InvestorCard = ({ investor }: InvestorCardProps) => {
  const { user } = useAuth();
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12 rounded-full">
            {investor.avatar_url ? (
              <AvatarImage src={investor.avatar_url} alt={investor.name} />
            ) : (
              <AvatarFallback className="bg-accent/10 text-accent">
                {investor.name?.charAt(0) || 'I'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-base">
                <InvestorProfilePopup investor={investor} />
              </h3>
              
              {user && user.id !== investor.id && (
                <Button 
                  size="sm" 
                  variant={isFollowing ? "outline" : "default"}
                  className="text-xs h-8"
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
              )}
            </div>
            
            <div className="space-y-1 mt-2">
              <p className="text-xs text-muted-foreground flex items-center">
                <Briefcase size={12} className="mr-1 flex-shrink-0" />
                <span>{investor.role || "Investor"} at {investor.company || "Independent"}</span>
              </p>
              
              {investor.industry && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Building size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.industry}</span>
                </p>
              )}
              
              {investor.location && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <MapPin size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.location}</span>
                </p>
              )}
              
              {investor.preferred_stages && investor.preferred_stages.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-start">
                  <Tags size={12} className="mr-1 mt-1 flex-shrink-0" />
                  <span>{investor.preferred_stages.join(", ")}</span>
                </p>
              )}
              
              {investor.investment_size && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <DollarSign size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.investment_size}</span>
                </p>
              )}
              
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Users size={12} className="mr-1 flex-shrink-0" />
                <span>{followersCount} followers · {followingCount} following</span>
              </p>
            </div>
          </div>
        </div>
        
        {investor.bio && (
          <p className="text-sm mt-3 line-clamp-2">{investor.bio}</p>
        )}
        
        {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {investor.preferred_sectors.map((sector, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {sector}
              </Badge>
            ))}
          </div>
        )}
        
        {investor.match_score !== null && (
          <div className="mt-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-muted rounded-full h-2 w-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${investor.match_score}%` }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Match score: {investor.match_score}%</p>
              </TooltipContent>
            </Tooltip>
            <p className="text-xs text-muted-foreground mt-1">
              {investor.match_score >= 80 
                ? "Excellent match for your business" 
                : investor.match_score >= 60 
                  ? "Good match for your business"
                  : investor.match_score >= 40
                    ? "Moderate match for your business"
                    : "Low match for your business"
              }
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <div className="w-full">
          <div id={`ai-chat-${investor.id}`} className="mt-1">
            <InvestorAIChat investor={investor} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
