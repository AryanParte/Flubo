
import React from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

interface DashboardSidebarProps {
  userName: string;
  userType: "investor" | "startup";
  isVerified: boolean;
  onVerificationClick?: () => void;
  lookingForFunding?: boolean;
  onFundingToggle?: (checked: boolean) => void;
  lookingForDesignPartner?: boolean;
  onDesignToggle?: (checked: boolean) => void;
}

export function DashboardSidebar({
  userName,
  userType,
  isVerified,
  onVerificationClick,
  lookingForFunding,
  onFundingToggle,
  lookingForDesignPartner,
  onDesignToggle
}: DashboardSidebarProps) {
  const { user } = useAuth();
  const [hasShownVerificationModal, setHasShownVerificationModal] = useState(false);
  
  // Load the verification modal state from localStorage
  useEffect(() => {
    const hasShown = localStorage.getItem('hasShownVerificationModal') === 'true';
    setHasShownVerificationModal(hasShown);
  }, []);
  
  // Determine the correct profile path based on user type
  const profilePath = userType === "investor" 
    ? `/investor/profile/${user?.id}` 
    : `/business/profile/${user?.id}`;
  
  const handleVerificationClick = () => {
    if (onVerificationClick) {
      // Set the flag in localStorage to prevent showing the modal again
      localStorage.setItem('hasShownVerificationModal', 'true');
      setHasShownVerificationModal(true);
      onVerificationClick();
    }
  };

  return (
    <div className="sticky top-24">
      <Card className="p-4 mb-4 bg-card border border-border/60">
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-muted mb-3 overflow-hidden">
            {/* Placeholder for profile image */}
            <div className="w-full h-full flex items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          
          <h3 className="font-semibold text-center">{userName || (userType === "investor" ? "Investor" : "Founder")}</h3>
          
          <span className="text-xs text-muted-foreground capitalize mb-2">
            {userType === "investor" ? "Investor" : "Business"}
          </span>
          
          {user?.id && (
            <Link 
              to={profilePath}
              className="text-sm text-accent hover:underline p-0 h-auto"
            >
              View profile
            </Link>
          )}
        </div>

        {/* Verification status */}
        {!isVerified && onVerificationClick && !hasShownVerificationModal && (
          <div className="mb-4">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full flex items-center gap-1.5 text-xs"
              onClick={handleVerificationClick}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Get Verified</span>
            </Button>
          </div>
        )}
        
        {/* Toggles - Only for startups */}
        {userType === "startup" && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            {lookingForFunding !== undefined && onFundingToggle && (
              <div className={cn("flex items-center gap-2", !isVerified && "opacity-80")}>
                <Switch 
                  id="looking-for-funding"
                  checked={lookingForFunding}
                  onCheckedChange={onFundingToggle}
                  disabled={!isVerified}
                  className="scale-90"
                />
                <Label htmlFor="looking-for-funding" className="text-xs">
                  Seeking funding
                </Label>
              </div>
            )}
            
            {lookingForDesignPartner !== undefined && onDesignToggle && (
              <div className={cn("flex items-center gap-2", !isVerified && "opacity-80")}>
                <Switch 
                  id="looking-for-design-partner"
                  checked={lookingForDesignPartner}
                  onCheckedChange={onDesignToggle}
                  disabled={!isVerified}
                  className="scale-90"
                />
                <Label htmlFor="looking-for-design-partner" className="text-xs">
                  Design partner
                </Label>
              </div>
            )}
            
            {!isVerified && (
              <p className="text-xs text-muted-foreground mt-1">
                Verify your account to enable these options
              </p>
            )}
          </div>
        )}
      </Card>
      
      {/* Stats card */}
      <Card className="p-4 bg-card border border-border/60">
        <h4 className="text-sm font-medium mb-3">Your Stats</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profile views</span>
            <span className="font-medium">24</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connection requests</span>
            <span className="font-medium">5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Messages</span>
            <span className="font-medium">3</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
