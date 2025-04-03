
import React from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, PlayCircle, Globe, Briefcase, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Default placeholder URLs - in a real app, these would come from the database
  const demoUrl = startup.demoUrl || '#';
  const websiteUrl = startup.websiteUrl || '#';

  return (
    <Card 
      className="flex flex-col h-full animate-fade-in border border-border overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-40 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain p-6" />
        ) : (
          <span className="font-medium text-5xl">{startup.name.charAt(0)}</span>
        )}
      </div>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg truncate mr-2">{startup.name}</h3>
          <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2 py-1 flex-shrink-0">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mb-2 flex-wrap">
          <span className="pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span className="truncate">{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{startup.bio || startup.tagline || 'No description available'}</p>
        
        <div className="flex flex-wrap gap-1.5 mb-2">
          <div className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs">
            {startup.industry || 'Technology'}
          </div>
          {startup.raised_amount && (
            <div className="px-2 py-0.5 rounded-md bg-secondary/50 text-secondary-foreground text-xs">
              Raised: {startup.raised_amount}
            </div>
          )}
        </div>

        {/* Partnership Status Indicators */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {startup.lookingForFunding && (
            <div className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Investment</span>
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
              <Handshake className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Partner</span>
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center h-8"
            onClick={(e) => handleOpenLink(demoUrl, e)}
            disabled={!demoUrl || demoUrl === '#'}
          >
            <PlayCircle size={14} className="mr-1" />
            Demo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center h-8"
            onClick={(e) => handleOpenLink(websiteUrl, e)}
            disabled={!websiteUrl || websiteUrl === '#'}
          >
            <Globe size={14} className="mr-1" />
            Website
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t border-border mt-auto">
        <div className="flex gap-2 w-full">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center h-9"
            onClick={() => onSkip(startup.id)}
          >
            <ThumbsDown size={14} className="mr-1" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center h-9"
            onClick={() => onInterested(startup.id)}
          >
            <ThumbsUp size={14} className="mr-1" />
            <span>Interested</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
