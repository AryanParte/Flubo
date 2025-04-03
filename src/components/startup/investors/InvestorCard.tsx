
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
  }, [investor?.id]);
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col border border-border">
      <CardContent className="p-6 pb-3 flex-grow">
        <div className="flex items-start space-x-4">
          <Avatar className="h-14 w-14 rounded-full">
            {investor.avatar_url ? (
              <AvatarImage src={investor.avatar_url} alt={investor.name} />
            ) : (
              <AvatarFallback className="bg-accent/10 text-accent">
                {investor.name?.charAt(0) || 'I'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1">
              <InvestorProfilePopup investor={investor} />
            </h3>
            
            <div className="space-y-2 mt-2">
              {investor.role && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Briefcase size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{investor.role || "Investor"} at {investor.company || "Independent"}</span>
                </p>
              )}
              
              {investor.industry && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Building size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{investor.industry}</span>
                </p>
              )}
              
              {investor.location && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <MapPin size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{investor.location}</span>
                </p>
              )}
              
              {investor.preferred_stages && investor.preferred_stages.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-start">
                  <Tags size={12} className="mr-2 mt-1 flex-shrink-0" />
                  <span className="truncate">{investor.preferred_stages.join(", ")}</span>
                </p>
              )}
              
              {investor.investment_size && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <DollarSign size={12} className="mr-2 flex-shrink-0" />
                  <span className="truncate">{investor.investment_size}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {investor.bio && (
          <p className="text-sm mt-4 mb-2 line-clamp-2">{investor.bio}</p>
        )}
        
        {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 mb-2">
            {investor.preferred_sectors.map((sector, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {sector}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-xs text-muted-foreground mt-4 border-t pt-3 border-border">
          <Users size={12} className="mr-1 flex-shrink-0" />
          <button 
            onClick={() => onShowFollowers?.(investor.id)}
            className="hover:underline cursor-pointer truncate"
            type="button"
          >
            <span>{followersCount} followers</span>
          </button>
          <span className="mx-1">·</span>
          <button 
            onClick={() => onShowFollowing?.(investor.id)}
            className="hover:underline cursor-pointer truncate"
            type="button"
          >
            <span>{followingCount} following</span>
          </button>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border">
        <div className="w-full">
          <div id={`ai-chat-${investor.id}`}>
            <InvestorAIChat investor={investor} />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
