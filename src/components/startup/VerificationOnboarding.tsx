
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { VerificationPrompt } from "@/components/verification/VerificationPrompt";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  
  const handleGetVerified = () => {
    navigate("/verification");
  };
  
  const handleSkip = () => {
    onOpenChange(false);
    
    // Mark that the verification prompt has been shown
    if (user) {
      supabase
        .from('profiles')
        .update({ verification_prompt_shown: true })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Error updating verification prompt status:", error);
          }
        });
    }
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
