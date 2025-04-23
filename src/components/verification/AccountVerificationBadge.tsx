
import React, { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface AccountVerificationBadgeProps {
  verified?: boolean;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  userId?: string;
}

export const AccountVerificationBadge: React.FC<AccountVerificationBadgeProps> = ({
  verified = false,  // Default to false if not explicitly set
  showText = true,
  size = "md",
  className,
  userId
}) => {
  const [isVerified, setIsVerified] = useState(verified);
  
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (userId) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('verified')
            .eq('id', userId)
            .single();
          
          if (data) {
            setIsVerified(data.verified ?? false);
          }
          
          if (error) {
            console.error("Error checking verification status:", error);
          }
        } catch (error) {
          console.error("Unexpected error checking verification:", error);
        }
      }
    };
    
    checkVerificationStatus();
  }, [userId]);
  
  // Don't render anything if not verified
  if (!isVerified) return null;
  
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
