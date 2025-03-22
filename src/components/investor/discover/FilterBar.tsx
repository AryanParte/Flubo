
import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type FilterBarProps = {
  appliedFilters: string[];
  setAppliedFilters: React.Dispatch<React.SetStateAction<string[]>>;
  sortOption: string;
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export const FilterBar = ({
  appliedFilters,
  setAppliedFilters,
  sortOption,
  onSortChange,
}: FilterBarProps) => {
  const handleFilterClick = () => {
    toast({
      title: "Filter options",
      description: "Filter functionality will be implemented soon",
    });
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setAppliedFilters(appliedFilters.filter(filter => filter !== filterToRemove));
    toast({
      title: "Filter removed",
      description: `Removed "${filterToRemove}" filter`,
    });
  };

  return (
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
        
        {appliedFilters.length > 0 && (
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
        )}
      </div>
      
      <select 
        className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        value={sortOption}
        onChange={onSortChange}
      >
        <option value="match">Highest Match</option>
        <option value="newest">Newest First</option>
      </select>
    </div>
  );
};
