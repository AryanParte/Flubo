
import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type AppliedFilters = {
  stage?: string[];
  industry?: string[];
  location?: string[];
  minMatch?: number;
};

type SortOption = "match" | "recent" | "raised";

type FilterBarProps = {
  appliedFilters: AppliedFilters;
  setAppliedFilters: React.Dispatch<React.SetStateAction<AppliedFilters>>;
  sortOption: SortOption;
  onSortChange: (newSort: SortOption) => void;
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

  const handleRemoveFilter = (filterCategory: string, filterValue: string) => {
    setAppliedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[filterCategory as keyof AppliedFilters]) {
        // @ts-ignore - We're checking if it exists above
        newFilters[filterCategory] = newFilters[filterCategory].filter(
          (f: string) => f !== filterValue
        );
        // Remove the key if the array is empty
        // First check if the value is an array (not minMatch which is a number)
        const currentValue = newFilters[filterCategory as keyof AppliedFilters];
        if (Array.isArray(currentValue) && currentValue.length === 0) {
          delete newFilters[filterCategory as keyof AppliedFilters];
        }
      }
      return newFilters;
    });
    
    toast({
      title: "Filter removed",
      description: `Removed "${filterValue}" filter`,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption);
  };

  // Helper to render applied filters
  const renderAppliedFilters = () => {
    const filters: JSX.Element[] = [];
    
    Object.entries(appliedFilters).forEach(([category, values]) => {
      if (category === 'minMatch' || !values) return;
      
      (values as string[]).forEach(value => {
        filters.push(
          <div 
            key={`${category}-${value}`} 
            className="flex items-center space-x-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-xs"
          >
            <span>{value}</span>
            <button 
              className="text-accent/70 hover:text-accent"
              onClick={() => handleRemoveFilter(category, value)}
            >
              ×
            </button>
          </div>
        );
      });
    });
    
    return filters;
  };

  const hasFilters = Object.keys(appliedFilters).length > 0;

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
        
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {renderAppliedFilters()}
          </div>
        )}
      </div>
      
      <select 
        className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        value={sortOption}
        onChange={handleSelectChange}
      >
        <option value="match">Highest Match</option>
        <option value="recent">Newest First</option>
        <option value="raised">Most Funding</option>
      </select>
    </div>
  );
};
