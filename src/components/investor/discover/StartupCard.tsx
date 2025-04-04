
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
      className="w-full animate-fade-in border border-border overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center p-6">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-medium text-6xl">
            {startup.name ? startup.name.charAt(0) : "?"}
          </span>
        )}
      </div>
      
      <CardContent className="p-6 flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg truncate max-w-[70%]">{startup.name}</h3>
          <div className="bg-accent/10 text-accent text-sm font-medium rounded-full px-3 py-1 flex-shrink-0">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground flex-wrap gap-2">
          <span className="inline-block pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span className="inline-block truncate max-w-[70%]">{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
          {startup.bio || startup.tagline || 'No description available'}
        </p>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="inline-block px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm">
            {startup.industry || 'Technology'}
          </div>
          {startup.raised_amount && (
            <div className="inline-block px-3 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-sm">
              Raised: {startup.raised_amount}
            </div>
          )}
        </div>

        {/* Partnership Status Indicators */}
        <div className="flex flex-wrap gap-2 pt-1">
          {startup.lookingForFunding && (
            <div className="inline-block px-3 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-sm flex items-center">
              <Briefcase className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>Seeking Investment</span>
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="inline-block px-3 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-sm flex items-center">
              <Handshake className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span>Seeking Partner</span>
            </div>
          )}
        </div>

        {/* External Links */}
        <div className="flex gap-3 mt-auto pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm flex items-center h-9 px-4"
            onClick={(e) => handleOpenLink(demoUrl, e)}
            disabled={!demoUrl || demoUrl === '#'}
          >
            <PlayCircle size={16} className="mr-2" />
            Demo
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm flex items-center h-9 px-4"
            onClick={(e) => handleOpenLink(websiteUrl, e)}
            disabled={!websiteUrl || websiteUrl === '#'}
          >
            <Globe size={16} className="mr-2" />
            Website
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-5 border-t border-border mt-auto">
        <div className="flex gap-4 w-full">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center h-10"
            onClick={() => onSkip(startup.id)}
          >
            <ThumbsDown size={16} className="mr-2" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center h-10"
            onClick={() => onInterested(startup.id)}
          >
            <ThumbsUp size={16} className="mr-2" />
            <span>Interested</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
