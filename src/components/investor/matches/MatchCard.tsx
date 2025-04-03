
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
      className="overflow-hidden flex flex-col bg-card border border-border animate-fade-in h-full"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-48 bg-secondary/30 flex items-center justify-center">
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
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{startup.tagline || 'No description available'}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
            {startup.industry || 'Technology'}
          </div>
          
          {/* Partnership Status Indicators */}
          {startup.lookingForFunding && (
            <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
              <Briefcase className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Investment</span>
            </div>
          )}
          {startup.lookingForDesignPartner && (
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
              <Handshake className="h-3 w-3 mr-1" />
              <span className="truncate">Seeking Design Partner</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border mt-auto">
        <div className="flex space-x-2 w-full">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center"
            onClick={() => onIgnore(startup)}
          >
            <ThumbsDown size={14} className="mr-1" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center"
            onClick={() => onRequestDemo(startup)}
          >
            <ThumbsUp size={14} className="mr-1" />
            <span>Interested</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
