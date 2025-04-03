
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
      className="w-full animate-fade-in border border-border overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-48 bg-secondary/30 flex items-center justify-center p-6">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-medium text-6xl">{startup.name.charAt(0)}</span>
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
          {startup.tagline || 'No description available'}
        </p>
        
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="inline-block px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-sm">
            {startup.industry || 'Technology'}
          </div>
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
      </CardContent>
      
      <CardFooter className="px-6 py-5 border-t border-border mt-auto">
        <div className="flex gap-4 w-full">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center h-10"
            onClick={() => onIgnore(startup)}
          >
            <ThumbsDown size={16} className="mr-2" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center h-10"
            onClick={() => onRequestDemo(startup)}
          >
            <ThumbsUp size={16} className="mr-2" />
            <span>Interested</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
