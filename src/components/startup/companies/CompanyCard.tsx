
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, PlayCircle, Globe, Briefcase, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { CompanyProfilePopup } from "./CompanyProfilePopup";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

type CompanyCardProps = {
  company: Startup;
  index: number;
  onInterested: (companyId: string) => Promise<void>;
  onSkip: (companyId: string) => Promise<void>;
};

export const CompanyCard = ({ 
  company, 
  index, 
  onInterested, 
  onSkip 
}: CompanyCardProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCardClick = () => {
    setIsProfileOpen(true);
  };

  // Default placeholder URLs
  const demoUrl = company.demoUrl || '#';
  const websiteUrl = company.websiteUrl || '#';

  return (
    <>
      <Card 
        className="flex flex-col h-full min-h-[500px] animate-fade-in border border-border overflow-hidden cursor-pointer"
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={handleCardClick}
      >
        <div className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center p-4">
          {company.logo ? (
            <img src={company.logo} alt={`${company.name} logo`} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-medium text-4xl">
              {company.name ? company.name.charAt(0) : "?"}
            </span>
          )}
        </div>
        
        <CardContent className="p-6 flex-grow flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-xl truncate max-w-[70%]">{company.name}</h3>
            <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex-shrink-0">
              {company.score}% Match
            </div>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground flex-wrap gap-1">
            <span className="inline-block pr-2 mr-2 border-r border-border">{company.stage || 'Early Stage'}</span>
            <span className="inline-block truncate max-w-[150px]">{company.location || 'Unknown Location'}</span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {company.bio || company.tagline || 'No description available'}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <div className="inline-block px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
              {company.industry || 'Technology'}
            </div>
            {company.raised_amount && (
              <div className="inline-block px-2.5 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs">
                Raised: {company.raised_amount}
              </div>
            )}
          </div>

          {/* Partnership Status Indicators */}
          <div className="flex flex-wrap gap-2">
            {company.lookingForFunding && (
              <div className="inline-block px-2.5 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
                <Briefcase className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">Seeking Investment</span>
              </div>
            )}
            {company.lookingForDesignPartner && (
              <div className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
                <Handshake className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">Seeking Design Partner</span>
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="flex gap-3 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center h-8"
              onClick={(e) => handleOpenLink(demoUrl, e)}
              disabled={!demoUrl || demoUrl === '#'}
            >
              <PlayCircle size={14} className="mr-1.5" />
              Demo
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center h-8"
              onClick={(e) => handleOpenLink(websiteUrl, e)}
              disabled={!websiteUrl || websiteUrl === '#'}
            >
              <Globe size={14} className="mr-1.5" />
              Website
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 border-t border-border">
          <div className="flex gap-3 w-full">
            <Button 
              variant="secondary"
              className="flex-1 flex justify-center items-center h-9"
              onClick={(e) => {
                e.stopPropagation();
                onSkip(company.id);
              }}
            >
              <ThumbsDown size={14} className="mr-1.5" />
              <span>Skip</span>
            </Button>
            <Button 
              variant="accent"
              className="flex-1 flex justify-center items-center h-9"
              onClick={(e) => {
                e.stopPropagation();
                onInterested(company.id);
              }}
            >
              <ThumbsUp size={14} className="mr-1.5" />
              <span>Interested</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Profile Popup */}
      <CompanyProfilePopup 
        company={company} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};
