import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  User, 
  Building, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  ArrowLeft,
  X 
} from "lucide-react";
import { type Investor } from "@/types/investor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { InvestorAIChat } from './InvestorAIChat';
import { useAuth } from "@/context/AuthContext";

interface InvestorCardProps {
  investor: Investor;
  onBack?: () => void;
  showBackButton?: boolean;
  onShowFollowers?: (userId: string) => void;
  onShowFollowing?: (userId: string) => void;
}

export const InvestorCard: React.FC<InvestorCardProps> = ({ 
  investor, 
  onBack,
  showBackButton = false,
  onShowFollowers,
  onShowFollowing
}) => {
  const { user } = useAuth();
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchSummary, setMatchSummary] = useState<string | null>(null);
  
  const handleStartChat = () => {
    setChatDialogOpen(true);
  };
  
  const handleCloseChat = () => {
    // Only close if user is an investor or if explicitly confirmed
    setChatDialogOpen(false);
  };
  
  const handleChatComplete = (score: number, summary: string) => {
    // Only set match score and summary for investors
    if (user?.id === investor.id) {
      setMatchScore(score);
      setMatchSummary(summary);
      setChatDialogOpen(false);
    }
    // For startups, we'll keep the dialog open and show a message within the chat component
  };
  
  // Determine if we should show match information (only for investors)
  const isInvestor = user?.id === investor.id;
  const showMatchInfo = isInvestor && matchScore !== null && matchSummary;
  
  return (
    <>
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
              {investor.avatar_url ? (
                <AvatarImage src={investor.avatar_url} alt={investor.name} />
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
              
              <p className="text-muted-foreground mb-3">{investor.role} at {investor.company}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {investor.preferred_sectors?.map((sector, i) => (
                  <Badge key={i} variant="secondary">{sector}</Badge>
                ))}
              </div>
              
              <div className="space-y-2 mb-4">
                {investor.preferred_stages && investor.preferred_stages.length > 0 && (
                  <div className="flex items-center text-sm">
                    <Briefcase size={16} className="mr-2 text-muted-foreground" />
                    <span>Invests in: {investor.preferred_stages.join(", ")}</span>
                  </div>
                )}
                
                {investor.location && (
                  <div className="flex items-center text-sm">
                    <MapPin size={16} className="mr-2 text-muted-foreground" />
                    <span>{investor.location}</span>
                  </div>
                )}
                
                {(investor.min_investment || investor.max_investment) && (
                  <div className="flex items-center text-sm">
                    <DollarSign size={16} className="mr-2 text-muted-foreground" />
                    <span>
                      {investor.min_investment && `$${investor.min_investment}`}
                      {investor.min_investment && investor.max_investment && " - "}
                      {investor.max_investment && `$${investor.max_investment}`}
                    </span>
                  </div>
                )}
              </div>
              
              {showMatchInfo && (
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
                  <span>Chat with AI assistant</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-background border-border" 
          onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle>Chat with {investor.name}'s AI Persona</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseChat} className="h-8 w-8">
                <X size={18} />
              </Button>
            </div>
            <DialogDescription>
              This is a simulated conversation with {investor.name} powered by AI.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <InvestorAIChat 
              investorId={investor.id} 
              investorName={investor.name}
              onBack={handleCloseChat}
              onComplete={handleChatComplete}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
