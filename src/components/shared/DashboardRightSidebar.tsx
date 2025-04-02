
import React from "react";
import { Card } from "@/components/ui/card";

export function DashboardRightSidebar() {
  return (
    <div className="sticky top-24">
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
