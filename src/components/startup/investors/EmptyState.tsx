
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const EmptyState = ({ searchQuery, setSearchQuery }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 bg-background/30 rounded-lg border border-border/60">
      <Search size={48} className="mx-auto text-muted-foreground/60" />
      <h3 className="mt-4 text-lg font-medium">No investors found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {searchQuery 
          ? `No results for "${searchQuery}"`
          : "There are no investors available at the moment."}
      </p>
      {searchQuery && (
        <Button 
          variant="link" 
          className="mt-2"
          onClick={() => setSearchQuery("")}
        >
          Clear search
        </Button>
      )}
    </div>
  );
};
