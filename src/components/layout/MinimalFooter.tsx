
import React from "react";

export function MinimalFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border/40 bg-background/50 py-3">
      <div className="container mx-auto px-4">
        <p className="text-xs text-muted-foreground text-center">
          © {currentYear} Flubo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
