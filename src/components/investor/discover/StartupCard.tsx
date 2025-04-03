
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
      className="overflow-hidden flex flex-col animate-fade-in h-full border border-border"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain p-6" />
        ) : (
          <span className="font-medium text-4xl">{startup.name.charAt(0)}</span>
        )}
      </div>
      
      <CardContent className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-xl truncate mr-2">{startup.name}</h3>
          <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-3 py-1 flex-shrink-0">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground mb-4 flex-wrap">
          <span className="pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span className="truncate">{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{startup.bio || startup.tagline || 'No description available'}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
            {startup.industry || 'Technology'}
          </div>
          {startup.raised_amount && (
            <div className="px-3 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs">
              Raised: {startup.raised_amount}
            </div>
          )}
        </div>

        {/* Partnership Status Indicators */}
        <div className="flex flex-wrap gap-2 mb-4">
          {startup.lookingForFunding && (
            <div className="px-3 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Investment</span>
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
              <Handshake className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Design Partner</span>
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="flex space-x-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center"
            onClick={(e) => handleOpenLink(demoUrl, e)}
            disabled={!demoUrl || demoUrl === '#'}
          >
            <PlayCircle size={14} className="mr-1" />
            Demo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center"
            onClick={(e) => handleOpenLink(websiteUrl, e)}
            disabled={!websiteUrl || websiteUrl === '#'}
          >
            <Globe size={14} className="mr-1" />
            Website
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border mt-auto">
        <div className="flex space-x-2 w-full">
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
      </CardFooter>
    </Card>
  );
};
