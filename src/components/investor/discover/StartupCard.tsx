
import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";

type StartupCardProps = {
  startup: Startup;
  index: number;
  onInterested: (startupId: string) => Promise<void>;
  onSkip: (startupId: string) => Promise<void>;
};

export const StartupCard = ({ 
  startup, 
  index, 
  onInterested, 
  onSkip 
}: StartupCardProps) => {
  return (
    <div 
      className="glass-card rounded-lg overflow-hidden flex flex-col animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
        <span className="font-medium text-xl">{startup.name.charAt(0)}</span>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold">{startup.name}</h3>
          <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          <span className="pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span>{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{startup.bio || startup.tagline || 'No description available'}</p>
        
        <div className="flex items-center text-xs mb-6">
          <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
            {startup.industry || 'Technology'}
          </div>
          {startup.raised_amount && (
            <div className="text-muted-foreground">
              Raised: {startup.raised_amount}
            </div>
          )}
        </div>
        
        <div className="mt-auto flex space-x-2">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center"
            onClick={() => onSkip(startup.id)}
          >
            <ThumbsDown size={14} className="mr-1" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center"
            onClick={() => onInterested(startup.id)}
          >
            <ThumbsUp size={14} className="mr-1" />
            <span>Interested</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
