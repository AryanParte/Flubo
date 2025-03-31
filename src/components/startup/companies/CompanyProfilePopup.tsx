
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
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Card className="border-0 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={`${company.name} logo`} 
                className="max-h-16 max-w-full object-contain" 
              />
            ) : (
              <Building className="h-10 w-10 text-accent/60" />
            )}
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1">{company.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{company.tagline || 'No tagline available'}</p>
            
            <div className="space-y-3">
              {company.bio && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1 font-medium">About</p>
                  <p>{company.bio}</p>
                </div>
              )}
              
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
              <div className="flex space-x-2 mt-2">
                {company.demoUrl && company.demoUrl !== '#' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs flex items-center"
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
                    className="text-xs flex items-center"
                    onClick={(e) => handleOpenLink(company.websiteUrl, e)}
                  >
                    <Globe size={14} className="mr-1" />
                    Website
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
