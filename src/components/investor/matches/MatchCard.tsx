
import React from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Startup } from "@/types/startup";

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
    <div 
      className="rounded-lg overflow-hidden flex flex-col bg-[#0F1620] border border-[#1E2A3B] animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="h-56 bg-[#1C2C3F] flex items-center justify-center">
        {startup.logo ? (
          <img src={startup.logo} alt={`${startup.name} logo`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="font-medium text-4xl">{startup.name.charAt(0)}</span>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-xl text-white">{startup.name}</h3>
          <div className="bg-[#1F422A] text-[#4BDA7C] text-xs font-medium rounded-full px-3 py-1 flex items-center">
            {startup.score}% Match
          </div>
        </div>
        
        <div className="flex items-center text-xs text-gray-400 mb-4">
          <span className="pr-2 mr-2 border-r border-[#2A3A4F]">{startup.stage || 'Early Stage'}</span>
          <span>{startup.location || 'Unknown Location'}</span>
        </div>
        
        <p className="text-sm text-gray-300 mb-4">{startup.tagline || 'No description available'}</p>
        
        <div className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-[#1F2A3B] text-gray-300 text-xs">
            {startup.industry || 'Technology'}
          </div>
        </div>
        
        <div className="mt-auto flex space-x-2">
          <Button 
            variant="secondary"
            className="flex-1 flex justify-center items-center bg-[#1F2A3B] text-gray-300 hover:bg-[#2A3A4F]"
            onClick={() => onIgnore(startup)}
          >
            <ThumbsDown size={14} className="mr-1" />
            <span>Skip</span>
          </Button>
          <Button 
            variant="accent"
            className="flex-1 flex justify-center items-center bg-[#3B8851] text-white hover:bg-[#2D6A3E]"
            onClick={() => onRequestDemo(startup)}
          >
            <ThumbsUp size={14} className="mr-1" />
            <span>Interested</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
