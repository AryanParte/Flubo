
import React from "react";
import { 
  CalendarIcon, 
  Users, 
  Building, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Globe, 
  PlayCircle, 
  LineChart,
  Handshake
} from "lucide-react";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";

interface CompanyProfilePopupProps {
  company: Startup;
  children: React.ReactNode;
}

export const CompanyProfilePopup = ({ company, children }: CompanyProfilePopupProps) => {
  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent className="w-[320px] p-0 border shadow-lg rounded-lg" sideOffset={5}>
        <div className="overflow-hidden">
          {/* Company Header */}
          <div className="bg-accent/10 dark:bg-accent/5 p-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md flex items-center justify-center bg-accent/10 text-accent shrink-0">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={`${company.name} logo`} 
                    className="w-10 h-10 object-contain" 
                  />
                ) : (
                  <Building className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{company.name}</h3>
                <p className="text-xs text-muted-foreground">{company.tagline || 'No tagline available'}</p>
              </div>
              {company.score && (
                <div className="absolute top-4 right-4 bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                  {company.score}% Match
                </div>
              )}
            </div>
          </div>
          
          {/* Company Details */}
          <div className="p-4 space-y-3">
            {/* Company Bio */}
            {company.bio && (
              <p className="text-sm">{company.bio}</p>
            )}
            
            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {company.industry && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{company.industry}</span>
                </div>
              )}
              
              {company.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{company.location}</span>
                </div>
              )}
              
              {company.stage && (
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-muted-foreground" />
                  <span>{company.stage}</span>
                </div>
              )}
              
              {company.founding_year && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Founded {company.founding_year}</span>
                </div>
              )}
              
              {company.team_size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{company.team_size} employees</span>
                </div>
              )}
              
              {company.raised_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>Raised: {company.raised_amount}</span>
                </div>
              )}
            </div>
            
            {/* Partnership Status */}
            <div className="flex flex-wrap gap-2 mt-2">
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
            
            {/* External Links */}
            <div className="flex space-x-2 pt-1">
              {company.demoUrl && company.demoUrl !== '#' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={(e) => handleOpenLink(company.demoUrl, e)}
                >
                  <PlayCircle size={14} className="mr-1" />
                  Demo
                </Button>
              )}
              
              {company.websiteUrl && company.websiteUrl !== '#' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={(e) => handleOpenLink(company.websiteUrl, e)}
                >
                  <Globe size={14} className="mr-1" />
                  Website
                </Button>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
