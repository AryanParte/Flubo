
import React from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Briefcase, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type MatchCardProps = {
  startup: Startup;
  index: number;
  onRequestDemo: (startup: Startup) => void;
  onIgnore: (startup: Startup) => void;
};

export const MatchCard = ({ 
  startup, 
  index, 
  onRequestDemo, 
  onIgnore 
}: MatchCardProps) => {
  return (
    <Card 
      className="flex flex-col h-full min-h-[450px] animate-fade-in border border-border overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-40 bg-secondary/30 flex items-center justify-center p-4">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-medium text-5xl">{startup.name.charAt(0)}</span>
        )}
      </div>
      
      <CardContent className="p-6 flex-grow flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg truncate max-w-[70%]">{startup.name}</h3>
          <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex-shrink-0">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-xs text-muted-foreground flex-wrap gap-1">
          <span className="inline-block pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
          <span className="inline-block truncate max-w-[150px]">{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {startup.tagline || 'No description available'}
        </p>
        
        <div className="flex flex-wrap gap-2">
          <div className="inline-block px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
            {startup.industry || 'Technology'}
          </div>
          
          {/* Partnership Status Indicators */}
          {startup.lookingForFunding && (
            <div className="inline-block px-2.5 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
              <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Seeking Investment</span>
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
              <Handshake className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">Seeking Partner</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border mt-auto">
        <div className="flex gap-3 w-full">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center h-9"
            onClick={() => onIgnore(startup)}
          >
            <ThumbsDown size={14} className="mr-1.5" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center h-9"
            onClick={() => onRequestDemo(startup)}
          >
            <ThumbsUp size={14} className="mr-1.5" />
            <span>Interested</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
