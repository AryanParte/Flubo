import React, { useState } from "react";
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
  Handshake,
  X,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";
import { supabase } from "@/lib/supabase";
import { PitchdeckViewer } from "@/components/startup/PitchdeckViewer";

interface CompanyProfilePopupProps {
  company: Startup;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyProfilePopup = ({ company, isOpen, onClose }: CompanyProfilePopupProps) => {
  const [showPitchdeckModal, setShowPitchdeckModal] = useState(false);

  const handleOpenLink = (url: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (url && url !== '#') {
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="overflow-hidden">
          {/* Company Header */}
          <div className="bg-accent/10 dark:bg-accent/5 p-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md flex items-center justify-center bg-accent/10 text-accent shrink-0">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={`${company.name} logo`} 
                    className="w-12 h-12 object-contain" 
                  />
                ) : (
                  <Building className="h-8 w-8" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-xl">{company.name}</h3>
                <p className="text-sm text-muted-foreground">{company.tagline || 'No tagline available'}</p>
              </div>
              {company.score && (
                <div className="absolute top-4 right-10 bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                  {company.score}% Match
                </div>
              )}
            </div>
          </div>
          
          {/* Company Details */}
          <div className="p-6 space-y-4">
            {/* Company Bio */}
            {company.bio && (
              <div>
                <h4 className="text-sm font-medium mb-2">About</h4>
                <p className="text-sm">{company.bio}</p>
              </div>
            )}
            
            {/* Quick Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Company Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                
                {company.foundedYear && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Founded {company.foundedYear}</span>
                  </div>
                )}
                
                {company.teamSize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{company.teamSize} employees</span>
                  </div>
                )}
                
                {company.raisedAmount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Raised: {company.raisedAmount}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Partnership Status */}
            <div>
              <h4 className="text-sm font-medium mb-2">Looking For</h4>
              <div className="flex flex-wrap gap-2">
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
            <div>
              <h4 className="text-sm font-medium mb-2">Links</h4>
              <div className="flex flex-wrap gap-2">
                {/* Add Pitchdeck Button if available */}
                {company.pitchdeckIsPublic && (company.pitchdeckUrl || company.pitchdeckPath) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (company.pitchdeckUrl) {
                        handleOpenLink(company.pitchdeckUrl, e);
                      } else if (company.pitchdeckPath) {
                        setShowPitchdeckModal(true);
                      }
                    }}
                  >
                    <FileText size={14} className="mr-1" />
                    Pitch Deck
                  </Button>
                )}
                
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
        </div>
      </DialogContent>

      {/* Pitchdeck Preview Dialog */}
      {company.pitchdeckPath && (
        <Dialog open={showPitchdeckModal} onOpenChange={setShowPitchdeckModal}>
          <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
            <DialogHeader className="px-4 py-2">
              <DialogTitle className="flex justify-between items-center">
                <span>{company.name} - Pitch Deck</span>
                <Button 
                  variant="ghost" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setShowPitchdeckModal(false)}
                >
                  <X size={16} />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            {/* Replace iframe with enhanced PitchdeckViewer */}
            <PitchdeckViewer 
              filePath={company.pitchdeckPath}
              fileName={company.name + " Pitch Deck"}
              fileUrl={company.pitchdeckUrl}
              onClose={() => setShowPitchdeckModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};
