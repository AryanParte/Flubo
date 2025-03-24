
import { useState } from "react";
import { Filter, ChevronDown, CheckIcon, ArrowDownAZ } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { AppliedFilters, SortOption } from "@/hooks/use-discover-companies";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  appliedFilters: AppliedFilters;
  setAppliedFilters: (filters: AppliedFilters) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

export const FilterBar = ({
  appliedFilters,
  setAppliedFilters,
  sortOption,
  onSortChange,
}: FilterBarProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const stageOptions = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];
  const industryOptions = [
    "AI & ML",
    "Fintech",
    "Healthcare",
    "Education",
    "E-commerce",
    "SaaS",
    "CleanTech",
    "Blockchain",
  ];
  const locationOptions = ["North America", "Europe", "Asia", "Africa", "South America", "Australia"];

  const handleStageChange = (stage: string) => {
    const currentStages = appliedFilters.stage || [];
    const updatedStages = currentStages.includes(stage)
      ? currentStages.filter((s) => s !== stage)
      : [...currentStages, stage];

    setAppliedFilters({
      ...appliedFilters,
      stage: updatedStages,
    });
  };

  const handleIndustryChange = (industry: string) => {
    const currentIndustries = appliedFilters.industry || [];
    const updatedIndustries = currentIndustries.includes(industry)
      ? currentIndustries.filter((i) => i !== industry)
      : [...currentIndustries, industry];

    setAppliedFilters({
      ...appliedFilters,
      industry: updatedIndustries,
    });
  };

  const handleLocationChange = (location: string) => {
    const currentLocations = appliedFilters.location || [];
    const updatedLocations = currentLocations.includes(location)
      ? currentLocations.filter((l) => l !== location)
      : [...currentLocations, location];

    setAppliedFilters({
      ...appliedFilters,
      location: updatedLocations,
    });
  };

  const handleMinMatchChange = (minMatch: number | null) => {
    setAppliedFilters({
      ...appliedFilters,
      minMatch: minMatch,
    });
  };

  const clearFilters = () => {
    setAppliedFilters({});
  };

  const totalFiltersApplied =
    (appliedFilters.stage?.length || 0) +
    (appliedFilters.industry?.length || 0) +
    (appliedFilters.location?.length || 0) +
    (appliedFilters.minMatch ? 1 : 0);

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <DropdownMenu open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1", totalFiltersApplied > 0 && "bg-accent/10 text-accent")}
          >
            <Filter size={16} />
            <span>Filters</span>
            {totalFiltersApplied > 0 && (
              <span className="ml-1 rounded-full bg-accent text-accent-foreground px-1.5 text-xs">
                {totalFiltersApplied}
              </span>
            )}
            <ChevronDown size={14} className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel>Company Stage</DropdownMenuLabel>
          {stageOptions.map((stage) => (
            <DropdownMenuCheckboxItem
              key={stage}
              checked={(appliedFilters.stage || []).includes(stage)}
              onCheckedChange={() => handleStageChange(stage)}
            >
              {stage}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Industry</DropdownMenuLabel>
          {industryOptions.map((industry) => (
            <DropdownMenuCheckboxItem
              key={industry}
              checked={(appliedFilters.industry || []).includes(industry)}
              onCheckedChange={() => handleIndustryChange(industry)}
            >
              {industry}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Location</DropdownMenuLabel>
          {locationOptions.map((location) => (
            <DropdownMenuCheckboxItem
              key={location}
              checked={(appliedFilters.location || []).includes(location)}
              onCheckedChange={() => handleLocationChange(location)}
            >
              {location}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Minimum Match</DropdownMenuLabel>
          {[70, 80, 90].map((percent) => (
            <DropdownMenuCheckboxItem
              key={percent}
              checked={appliedFilters.minMatch === percent}
              onCheckedChange={() =>
                handleMinMatchChange(appliedFilters.minMatch === percent ? null : percent)
              }
            >
              {percent}%+
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />
          {totalFiltersApplied > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu open={sortOpen} onOpenChange={setSortOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <ArrowDownAZ size={16} />
            <span>
              Sort by:{" "}
              <span className="font-medium">
                {sortOption === "match"
                  ? "Match"
                  : sortOption === "recent"
                  ? "Recent"
                  : "Funding"}
              </span>
            </span>
            <ChevronDown size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px]">
          <DropdownMenuItem onClick={() => onSortChange("match")}>
            <div className="flex items-center w-full">
              <span className="flex-1">Match</span>
              {sortOption === "match" && <CheckIcon size={16} />}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("recent")}>
            <div className="flex items-center w-full">
              <span className="flex-1">Most Recent</span>
              {sortOption === "recent" && <CheckIcon size={16} />}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange("raised")}>
            <div className="flex items-center w-full">
              <span className="flex-1">Most Funding</span>
              {sortOption === "raised" && <CheckIcon size={16} />}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
