
import React from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const MatchesTab = () => {
  const handleContactClick = (startupName: string) => {
    toast({
      title: "Contact initiated",
      description: `Opening chat with ${startupName}`,
    });
  };

  return (
    <div>
      <div className="p-10 text-center rounded-lg border border-dashed border-border mb-8">
        <h3 className="text-xl font-medium mb-2">No Matches Yet</h3>
        <p className="text-muted-foreground mb-4">
          When you express interest in startups, and they accept, they'll appear here.
        </p>
        <Button onClick={() => document.getElementById("discover-tab-button")?.click()}>
          Discover Startups
        </Button>
      </div>

      <h3 className="text-lg font-medium mb-4">Recently Viewed</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border border-border p-6 bg-background">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium">HealthAI Solutions</h4>
            <div className="text-xs text-muted-foreground">
              Viewed 2 days ago
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered diagnostic tools for underserved healthcare markets in Africa.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => handleContactClick("HealthAI Solutions")}
          >
            <MessageSquare size={14} className="mr-1" />
            Contact Startup
          </Button>
        </div>
      </div>
    </div>
  );
};
