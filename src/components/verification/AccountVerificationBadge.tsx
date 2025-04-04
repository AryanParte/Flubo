
import React from "react";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountVerificationBadgeProps {
  verified?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const AccountVerificationBadge: React.FC<AccountVerificationBadgeProps> = ({
  verified = true,
  showText = true,
  size = "md",
  className,
}) => {
  // If not verified, don't render anything
  if (!verified) return null;
  
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };
  
  const textClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="bg-accent/10 p-0.5 rounded-full flex items-center justify-center">
        <UserCheck className={cn("text-accent", sizeClasses[size])} />
      </div>
      {showText && (
        <span className={cn("text-muted-foreground font-medium", textClasses[size])}>
          Verified
        </span>
      )}
    </div>
  );
};
