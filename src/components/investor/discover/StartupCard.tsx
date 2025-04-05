import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, PlayCircle, Globe, Briefcase, Handshake, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/startup/VideoPlayer";

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
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log("Opening URL:", url);
    if (url && url !== '#') {
      const validUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(validUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log("URL is invalid:", url);
    }
  };

  const handleDemoClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (startup.demoUrl || startup.demoVideo || startup.demoVideoPath) {
      setShowDemoModal(true);
    }
  };

  const websiteUrl = startup.websiteUrl || startup.website || '#';
  console.log("Startup website URL:", websiteUrl, "Original website field:", startup.website);
  
  const hasDemoContent = startup.demoUrl || startup.demoVideo || startup.demoVideoPath;
  const hasWebsite = websiteUrl && websiteUrl !== '#';

  return (
    <>
      <div 
        className="rounded-lg overflow-hidden flex flex-col bg-card border border-border animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
          {startup.logo ? (
            <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-medium text-4xl">{startup.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-xl">{startup.name}</h3>
            <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
              {startup.score}% Match
            </div>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground mb-4">
            <span className="pr-2 mr-2 border-r border-border">{startup.stage || 'Early Stage'}</span>
            <span>{startup.location || 'Unknown Location'}</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{startup.bio || startup.tagline || 'No description available'}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
              {startup.industry || 'Technology'}
            </div>
            {startup.raised_amount && (
              <div className="px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs">
                Raised: {startup.raised_amount}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {startup.lookingForFunding && (
              <div className="px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
                <Briefcase className="h-3 w-3 mr-1" />
                Seeking Investment
              </div>
            )}
            {startup.lookingForDesignPartner && (
              <div className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
                <Handshake className="h-3 w-3 mr-1" />
                Seeking Design Partner
              </div>
            )}
          </div>

          <div className="flex space-x-2 mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center"
              onClick={handleDemoClick}
              disabled={!hasDemoContent}
            >
              <PlayCircle size={14} className="mr-1" />
              Demo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center"
              onClick={(e) => handleOpenLink(websiteUrl, e)}
              disabled={!hasWebsite}
            >
              <Globe size={14} className="mr-1" />
              Website
            </Button>
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

      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{startup.name} - Demo</span>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowDemoModal(false)}
              >
                <X size={16} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <VideoPlayer 
              youtubeUrl={startup.demoVideo}
              videoPath={startup.demoVideoPath}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
