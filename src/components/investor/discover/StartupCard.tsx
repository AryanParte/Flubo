
import React from "react";
import { EyeOff, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Briefcase, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { cn } from "@/lib/utils";

type StartupCardProps = {
  startup: Startup;
  index: number;
  onInterested: (startupId: string) => void;
  onSkip: (startupId: string) => void;
};

export const StartupCard = ({ 
  startup, 
  index, 
  onInterested, 
  onSkip 
}: StartupCardProps) => {
  // Get the website URL from any available source
  const websiteUrl = startup.websiteUrl || startup.website || null;
  // Consider any non-empty website value as valid
  const hasWebsite = Boolean(websiteUrl && websiteUrl.trim() !== '' && websiteUrl !== '#');
  
  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      const validUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(validUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isInStealthMode = startup.stealthMode;

  return (
    <div 
      className={cn(
        "overflow-hidden flex flex-col glass-card animate-fade-in",
        isInStealthMode ? "border-amber-500/30" : ""
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-56 bg-background/50 flex items-center justify-center">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="h-20 w-20 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <span className="font-semibold text-4xl">{startup.name.charAt(0)}</span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-xl">{startup.name}</h3>
          <div className="flex items-center gap-2">
            {isInStealthMode && (
              <div className="bg-amber-400/20 text-amber-400 text-xs font-medium rounded-full px-2 py-1 flex items-center">
                <EyeOff className="h-3 w-3 mr-1" />
                <span>Stealth</span>
              </div>
            )}
            <div className="bg-accent/20 text-accent text-xs font-medium rounded-full px-3 py-1 flex items-center">
              {startup.score}% Match
            </div>
          </div>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mb-4">
          <span className="pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span>{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">{startup.tagline || 'No description available'}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
            {startup.industry || 'Technology'}
          </div>
          
          {/* Partnership Status Indicators */}
          {startup.lookingForFunding && (
            <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              Seeking Investment
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs flex items-center">
              <Handshake className="h-3 w-3 mr-1" />
              Seeking Design Partner
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mb-4">
          <button
            className={`inline-flex items-center px-3 py-1 rounded-full ${hasWebsite ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'}`}
            onClick={(e) => websiteUrl && handleOpenLink(websiteUrl, e)}
            disabled={!hasWebsite}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Visit Website
          </button>
        </div>
        
        <div className="mt-auto flex space-x-2">
          <Button 
            variant="outline"
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
