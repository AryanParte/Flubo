
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UserCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountVerificationBadgeProps {
  verified?: boolean;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const AccountVerificationBadge: React.FC<AccountVerificationBadgeProps> = ({
  verified = false,
  size = "md",
  showText = false,
  className
}) => {
  if (!verified) return null;
  
  const sizesMap = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center", className)}>
            <div className={cn(
              "inline-flex items-center justify-center rounded-full bg-accent/10",
              size === "sm" ? "p-0.5" : size === "md" ? "p-0.5" : "p-1"
            )}>
              <Check className={cn("text-accent", sizesMap[size])} />
            </div>
            {showText && (
              <span className="ml-1 text-xs font-medium text-accent">Verified</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Verified Account</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
