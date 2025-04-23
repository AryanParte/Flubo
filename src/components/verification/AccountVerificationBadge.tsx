
import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
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
          console.log(`AccountVerificationBadge: Checking verification for user ${userId}, initial verified state:`, verified);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('verified, email')
            .eq('id', userId)
            .single();
          
          if (data) {
            console.log(`AccountVerificationBadge: User ${userId} verification from DB:`, data.verified, "Email:", data.email);
            setIsVerified(data.verified ?? false);
          }
          
          if (error) {
            console.error("Error checking verification status:", error);
          }
        } catch (error) {
          console.error("Unexpected error checking verification:", error);
        }
      } else {
        // If userId is not provided, use the passed prop
        console.log(`AccountVerificationBadge: No userId provided, using passed verified prop:`, verified);
        setIsVerified(verified);
      }
    };
    
    checkVerificationStatus();
  }, [userId, verified]);
  
  // Add additional logging to debug rendering
  console.log(`AccountVerificationBadge: Will render? isVerified=${isVerified}`);
  
  // Don't render anything if not verified
  if (!isVerified) {
    console.log(`AccountVerificationBadge: Not rendering badge for user ${userId || 'unknown'} as isVerified is:`, isVerified);
    return null;
  }
  
  console.log(`AccountVerificationBadge: Rendering badge for user ${userId || 'unknown'}`);
  
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
  
  // Use a simpler badge design to ensure visibility
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="bg-blue-500 p-0.5 rounded-full flex items-center justify-center">
        <Check className={cn("text-white", sizeClasses[size])} />
      </div>
      {showText && (
        <span className={cn("text-muted-foreground font-medium", textClasses[size])}>
          Verified
        </span>
      )}
    </div>
  );
};
