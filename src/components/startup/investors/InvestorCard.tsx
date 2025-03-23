
import React from "react";
import { Mail, Briefcase, Building, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Investor = {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  industry?: string;
  location?: string;
  role?: string;
  company?: string;
};

interface InvestorCardProps {
  investor: Investor;
  onConnect: (investorId: string, investorName: string) => void;
  isConnecting: boolean;
}

export const InvestorCard = ({ investor, onConnect, isConnecting }: InvestorCardProps) => {
  return (
    <div 
      className="p-4 border border-border/60 rounded-lg bg-background/40 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start space-x-3">
        <Avatar className="h-12 w-12 rounded-full">
          <AvatarFallback className="bg-accent/10 text-accent">
            {investor.name?.charAt(0) || 'I'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-base">{investor.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Briefcase size={12} className="mr-1" />
            {investor.role} at {investor.company}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Building size={12} className="mr-1" />
            {investor.industry}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <MapPin size={12} className="mr-1" />
            {investor.location}
          </p>
          <p className="text-sm mt-3 line-clamp-2">{investor.bio}</p>
          
          <Button
            variant="accent"
            size="sm"
            className="w-full mt-4 flex items-center justify-center"
            onClick={() => onConnect(investor.id, investor.name)}
            disabled={isConnecting === investor.id}
          >
            {isConnecting === investor.id ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail size={14} className="mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
