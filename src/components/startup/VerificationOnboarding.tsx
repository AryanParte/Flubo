
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { VerificationPrompt } from "@/components/verification/VerificationPrompt";

interface VerificationOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType?: "startup" | "investor";
}

export const VerificationOnboarding: React.FC<VerificationOnboardingProps> = ({
  open,
  onOpenChange,
  userType = "startup"
}) => {
  const navigate = useNavigate();
  
  const handleGetVerified = () => {
    navigate("/verification");
  };
  
  const handleSkip = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0">
        <VerificationPrompt 
          onGetVerified={handleGetVerified} 
          onSkip={handleSkip} 
          isModal={true}
          userType={userType}
        />
      </DialogContent>
    </Dialog>
  );
};
