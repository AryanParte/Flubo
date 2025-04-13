import React, { useState } from 'react';
import { InvestorAIChat } from './InvestorAIChat';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Building, MapPin, DollarSign, Briefcase, ArrowLeft } from "lucide-react";
import { type Investor } from "@/types/investor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";

interface InvestorCardProps {
  investor: Investor;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({ 
  investor, 
  onBack,
  showBackButton = false
}) => {
  const [showChat, setShowChat] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchSummary, setMatchSummary] = useState<string | null>(null);
  
  const handleStartChat = () => {
    setShowChat(true);
  };
  
  const handleBackFromChat = () => {
    setShowChat(false);
  };
  
  const handleChatComplete = (score: number, summary: string) => {
    setMatchScore(score);
    setMatchSummary(summary);
    setShowChat(false);
  };
  
  if (showChat) {
    return (
      <InvestorAIChat 
        investorId={investor.id} 
        investorName={investor.name}
        onBack={handleBackFromChat}
        onComplete={handleChatComplete}
      />
    );
  }
  
  return (
    <Card className="overflow-hidden">
      {showBackButton && onBack && (
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
            <ArrowLeft size={16} />
            <span>Back to results</span>
          </Button>
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {investor.avatarUrl ? (
              <AvatarImage src={investor.avatarUrl} alt={investor.name} />
            ) : (
              <AvatarFallback className="bg-accent/10 text-accent">
                {investor.name?.substring(0, 2).toUpperCase() || "IN"}
              </AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">{investor.name}</h3>
              {investor.verified && <AccountVerificationBadge verified />}
            </div>
            
            <p className="text-muted-foreground mb-3">{investor.position} at {investor.company}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {investor.preferredSectors?.map((sector, i) => (
                <Badge key={i} variant="secondary">{sector}</Badge>
              ))}
            </div>
            
            <div className="space-y-2 mb-4">
              {investor.preferredStages && investor.preferredStages.length > 0 && (
                <div className="flex items-center text-sm">
                  <Briefcase size={16} className="mr-2 text-muted-foreground" />
                  <span>Invests in: {investor.preferredStages.join(", ")}</span>
                </div>
              )}
              
              {investor.location && (
                <div className="flex items-center text-sm">
                  <MapPin size={16} className="mr-2 text-muted-foreground" />
                  <span>{investor.location}</span>
                </div>
              )}
              
              {(investor.minInvestment || investor.maxInvestment) && (
                <div className="flex items-center text-sm">
                  <DollarSign size={16} className="mr-2 text-muted-foreground" />
                  <span>
                    {investor.minInvestment && `$${investor.minInvestment}`}
                    {investor.minInvestment && investor.maxInvestment && " - "}
                    {investor.maxInvestment && `$${investor.maxInvestment}`}
                  </span>
                </div>
              )}
            </div>
            
            {matchScore !== null && matchSummary && (
              <div className="mb-4 p-3 bg-accent/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Match Analysis</h4>
                  <Badge variant="outline" className="bg-accent/20">
                    {matchScore}% Match
                  </Badge>
                </div>
                <p className="text-sm">{matchSummary}</p>
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <Button 
                variant="accent" 
                className="flex-1 flex items-center justify-center gap-1"
                onClick={handleStartChat}
              >
                <MessageSquare size={16} />
                <span>Simulate Pitch</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
