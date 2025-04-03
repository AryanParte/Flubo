
import { useState, useEffect } from "react";
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

interface InvestorCardProps {
  investor: Investor;
  onShowFollowers?: (userId: string) => void;
  onShowFollowing?: (userId: string) => void;
}

export const InvestorCard = ({ investor, onShowFollowers, onShowFollowing }: InvestorCardProps) => {
  const { followersCount, followingCount, loadFollowData } = useFollowUser();
  
  useEffect(() => {
    if (investor?.id) {
      loadFollowData(investor.id);
    }
  }, [investor?.id, loadFollowData]);
  
  return (
    <Card className="w-full border border-border bg-card overflow-hidden">
      <CardContent className="p-6 flex flex-col space-y-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 rounded-full flex-shrink-0">
            {investor.avatar_url ? (
              <AvatarImage src={investor.avatar_url} alt={investor.name} />
            ) : (
              <AvatarFallback className="bg-accent/10 text-accent text-lg">
                {investor.name?.charAt(0) || 'I'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg mb-3">
              <InvestorProfilePopup investor={investor} />
            </h3>
            
            <div className="space-y-3">
              {investor.role && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase size={14} className="flex-shrink-0" />
                  <span className="truncate">{investor.role || "Investor"} at {investor.company || "Independent"}</span>
                </p>
              )}
              
              {investor.industry && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building size={14} className="flex-shrink-0" />
                  <span className="truncate">{investor.industry}</span>
                </p>
              )}
              
              {investor.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span className="truncate">{investor.location}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {investor.bio && (
          <p className="text-sm line-clamp-2">{investor.bio}</p>
        )}
        
        {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {investor.preferred_sectors.slice(0, 3).map((sector, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                {sector}
              </Badge>
            ))}
            {investor.preferred_sectors.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{investor.preferred_sectors.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground pt-4 border-t border-border mt-auto">
          <button 
            onClick={() => onShowFollowers?.(investor.id)}
            className="hover:underline cursor-pointer flex items-center gap-1 mr-4"
            type="button"
          >
            <Users size={12} />
            <span>{followersCount} followers</span>
          </button>
          <button 
            onClick={() => onShowFollowing?.(investor.id)}
            className="hover:underline cursor-pointer"
            type="button"
          >
            <span>{followingCount} following</span>
          </button>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-5 border-t border-border">
        <div className="w-full">
          <div id={`ai-chat-${investor.id}`}>
            <InvestorAIChat investor={investor} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
