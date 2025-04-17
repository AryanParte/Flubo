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
  verified = true,
  showText = true,
  size = "md",
  className,
  userId
}) => {
  const [shouldShow, setShouldShow] = useState(verified);
  
  useEffect(() => {
    // If userId is provided, check if it's the specific user to exclude
    const checkUser = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.error("Error checking user:", error);
          return;
        }
        
        // Don't show badge for user with email aryanp1117@gmail.com
        if (data?.email === 'aryanp1117@gmail.com') {
          setShouldShow(false);
        }
      } catch (error) {
        console.error("Error in AccountVerificationBadge:", error);
      }
    };
    
    checkUser();
  }, [userId]);
  
  // If not verified or it's the specific user, don't render anything
  if (!shouldShow) return null;
  
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
