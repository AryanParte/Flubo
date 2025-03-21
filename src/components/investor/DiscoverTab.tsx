
import React, { useState } from "react";
import { Filter, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

type Startup = {
  id: string;
  name: string;
  score: number;
  stage: string;
  location: string;
  sector: string;
  description: string;
  raised: string;
};

export const DiscoverTab = () => {
  const [appliedFilters, setAppliedFilters] = useState<string[]>(["AI & ML", "Fintech", "Africa"]);
  const [startups, setStartups] = useState<Startup[]>([
    { 
      id: "1",
      name: "HealthAI Solutions", 
      score: 94, 
      stage: "Series A",
      location: "Nairobi, Kenya",
      sector: "Healthcare AI",
      description: "AI-powered diagnostic tools for underserved healthcare markets in Africa.",
      raised: "$2.5M"
    },
    { 
      id: "2",
      name: "EcoFinance", 
      score: 87, 
      stage: "Seed",
      location: "São Paulo, Brazil",
      sector: "Fintech",
      description: "Sustainable microlending platform for small businesses in emerging markets.",
      raised: "$750K"
    },
    { 
      id: "3",
      name: "AgriTech Global", 
      score: 82, 
      stage: "Pre-seed",
      location: "Bangalore, India",
      sector: "AgriTech",
      description: "IoT solutions for smallholder farmers to optimize crop yields and reduce waste.",
      raised: "$350K"
    },
  ]);

  const handleFilterClick = () => {
    toast({
      title: "Filter options",
      description: "Opening filter dialog",
    });
    // In a real app, this would open a filter dialog
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setAppliedFilters(appliedFilters.filter(filter => filter !== filterToRemove));
    toast({
      title: "Filter removed",
      description: `Removed "${filterToRemove}" filter`,
    });
  };

  const handleInterestedClick = (startupId: string) => {
    // In a real app, this would make an API call to save the interest
    toast({
      title: "Interest registered",
      description: `Startup added to your matches`,
    });
    setStartups(prevStartups => 
      prevStartups.filter(startup => startup.id !== startupId)
    );
  };

  const handleSkipClick = (startupId: string) => {
    // In a real app, this would make an API call to skip the startup
    toast({
      title: "Startup skipped",
      description: `Startup removed from your discover feed`,
    });
    setStartups(prevStartups => 
      prevStartups.filter(startup => startup.id !== startupId)
    );
  };

  const handleLoadMore = () => {
    // In a real app, this would fetch more startups
    toast({
      title: "Loading more startups",
      description: "Fetching additional startup profiles",
    });
    
    // Simulating loading more startups
    const newStartups: Startup[] = [
      { 
        id: "4",
        name: "CleanEnergy Solutions", 
        score: 79, 
        stage: "Seed",
        location: "Cape Town, South Africa",
        sector: "CleanTech",
        description: "Renewable energy solutions for off-grid communities in Africa.",
        raised: "$1.2M"
      },
      { 
        id: "5",
        name: "EdTech Innovators", 
        score: 76, 
        stage: "Pre-seed",
        location: "Lagos, Nigeria",
        sector: "Education",
        description: "Mobile learning platform for K-12 students in emerging markets.",
        raised: "$250K"
      }
    ];
    
    setStartups(prev => [...prev, ...newStartups]);
  };
  
  return (
    <div>
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Button 
            variant="outline"
            size="sm"
            className="inline-flex items-center space-x-1"
            onClick={handleFilterClick}
          >
            <Filter size={14} />
            <span>Filters</span>
          </Button>
          
          <div className="flex flex-wrap gap-2">
            {appliedFilters.map((filter, index) => (
              <div key={index} className="flex items-center space-x-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">
                <span>{filter}</span>
                <button 
                  className="text-accent/70 hover:text-accent"
                  onClick={() => handleRemoveFilter(filter)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <select className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option>Highest Match</option>
          <option>Newest First</option>
          <option>Trending</option>
        </select>
      </div>
      
      {/* Startup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map((startup, index) => (
          <div 
            key={startup.id} 
            className="glass-card rounded-lg overflow-hidden flex flex-col animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 flex items-center justify-center">
              <span className="font-medium text-xl">{startup.name.charAt(0)}</span>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{startup.name}</h3>
                <div className="bg-accent/10 text-accent text-xs font-medium rounded-full px-2.5 py-1 flex items-center">
                  {startup.score}% Match
                </div>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mb-4">
                <span className="pr-2 mr-2 border-r border-border">{startup.stage}</span>
                <span>{startup.location}</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{startup.description}</p>
              
              <div className="flex items-center text-xs mb-6">
                <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
                  {startup.sector}
                </div>
                <div className="text-muted-foreground">
                  Raised: {startup.raised}
                </div>
              </div>
              
              <div className="mt-auto flex space-x-2">
                <Button 
                  variant="secondary"
                  className="flex-1 flex justify-center items-center"
                  onClick={() => handleSkipClick(startup.id)}
                >
                  <ThumbsDown size={14} className="mr-1" />
                  <span>Skip</span>
                </Button>
                <Button 
                  variant="accent"
                  className="flex-1 flex justify-center items-center"
                  onClick={() => handleInterestedClick(startup.id)}
                >
                  <ThumbsUp size={14} className="mr-1" />
                  <span>Interested</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More */}
      <div className="mt-8 text-center">
        <Button 
          variant="outline"
          onClick={handleLoadMore}
        >
          Load More Startups
        </Button>
      </div>
    </div>
  );
};
