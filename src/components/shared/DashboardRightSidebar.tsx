
import React from "react";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardRightSidebar() {
  const isMobile = useIsMobile();
  
  // Don't render the sidebar on mobile devices
  if (isMobile) return null;
  
  return (
    <div className="sticky top-24 w-full max-w-[280px] hidden lg:block">
      <Card className="p-4 mb-4 bg-card border border-border/60">
        <h4 className="text-sm font-medium mb-3">Trending Topics</h4>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This sidebar is reserved for future content like trending startups, latest matches, or reminders.
          </p>
        </div>
      </Card>
    </div>
  );
}
