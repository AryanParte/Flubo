
import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink, PlayCircle, Globe, Briefcase, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { CompanyProfilePopup } from "./CompanyProfilePopup";

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
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  const handleCardClick = () => {
    setIsProfileOpen(true);
  };

  // Default placeholder URLs - in a real app, these would come from the database
  const demoUrl = company.demoUrl || '#';
  const websiteUrl = company.websiteUrl || '#';

  return (
    <>
      <div 
        className="rounded-lg overflow-hidden flex flex-col bg-card border border-border animate-fade-in cursor-pointer h-full"
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={handleCardClick}
      >
        <div className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
          {company.logo ? (
            <img src={company.logo} alt={`${company.name} logo`} className="max-h-full max-w-full object-contain p-4" />
          ) : (
            <span className="font-medium text-4xl">{company.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3 gap-2">
            <h3 className="font-semibold text-xl truncate">{company.name}</h3>
            <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center whitespace-nowrap">
              {company.score}% Match
            </div>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground mb-4 flex-wrap gap-y-1">
            {company.stage && (
              <span className="pr-2 mr-2 border-r border-border">{company.stage}</span>
            )}
            {company.location && (
              <span className="truncate">{company.location}</span>
            )}
            {!company.stage && !company.location && (
              <span>Unknown details</span>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {company.bio || company.tagline || 'No description available'}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
              {company.industry || 'Technology'}
            </div>
            {company.raised_amount && (
              <div className="px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs">
                Raised: {company.raised_amount}
              </div>
            )}
          </div>

          {/* Partnership Status Indicators */}
          <div className="flex flex-wrap gap-2 mb-4">
            {company.lookingForFunding && (
              <div className="px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center">
                <Briefcase className="h-3 w-3 mr-1" />
                Seeking Investment
              </div>
            )}
            {company.lookingForDesignPartner && (
              <div className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs flex items-center">
                <Handshake className="h-3 w-3 mr-1" />
                Seeking Design Partner
              </div>
            )}
          </div>
        </div>

        {/* External Links */}
        <div className="px-6 flex space-x-2 mb-4">
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
        
        <div className="px-6 pb-6 mt-auto flex space-x-2">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center"
            onClick={(e) => {
              e.stopPropagation();
              onSkip(company.id);
            }}
          >
            <ThumbsDown size={14} className="mr-1" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center"
            onClick={(e) => {
              e.stopPropagation();
              onInterested(company.id);
            }}
          >
            <ThumbsUp size={14} className="mr-1" />
            <span>Interested</span>
          </Button>
        </div>
      </div>

      {/* Profile Popup */}
      <CompanyProfilePopup 
        company={company} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
};
