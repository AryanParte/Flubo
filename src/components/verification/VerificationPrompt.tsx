
import React from "react";
import { UserCheck, Shield, TrendingUp, Search, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface VerificationPromptProps {
  onGetVerified?: () => void;
  onSkip?: () => void;
  isModal?: boolean;
  userType?: string;
}

export const VerificationPrompt: React.FC<VerificationPromptProps> = ({
  onGetVerified,
  onSkip,
  isModal = false,
  userType = "startup"
}) => {
  const navigate = useNavigate();
  
  const handleGetVerified = () => {
    if (onGetVerified) {
      onGetVerified();
    } else {
      navigate("/verification");
    }
  };
  
  const isPricingForStartup = userType === "startup";
  
  return (
    <Card className={isModal ? "" : "max-w-3xl mx-auto mt-8"}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl flex items-center justify-center">
          <UserCheck className="mr-2 h-6 w-6 text-accent" />
          Get Verified on Flubo
        </CardTitle>
        <CardDescription className="text-base max-w-xl mx-auto">
          Build trust and get discovered faster with a verified account badge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-accent/5 rounded-lg">
            <Shield className="h-8 w-8 mb-2 text-accent/80" />
            <h3 className="font-medium mb-1">Build Trust</h3>
            <p className="text-sm text-muted-foreground">
              Show other users that your identity and business are legitimate
            </p>
          </div>
          
          <div className="p-4 bg-accent/5 rounded-lg">
            <TrendingUp className="h-8 w-8 mb-2 text-accent/80" />
            <h3 className="font-medium mb-1">Rank Higher</h3>
            <p className="text-sm text-muted-foreground">
              Get prioritized in search results, feed, and match rankings
            </p>
          </div>
          
          <div className="p-4 bg-accent/5 rounded-lg">
            <Award className="h-8 w-8 mb-2 text-accent/80" />
            <h3 className="font-medium mb-1">Stand Out</h3>
            <p className="text-sm text-muted-foreground">
              Display your verified badge across all platform interactions
            </p>
          </div>
        </div>
        
        <div className="text-center py-4">
          <div className="text-3xl font-bold mb-2">${isPricingForStartup ? '10' : '20'}</div>
          <div className="text-sm text-muted-foreground">One-time verification fee</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          className="w-full sm:w-auto"
          onClick={handleGetVerified}
          size="lg"
        >
          Get Verified
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {onSkip && (
          <Button 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onSkip}
            size="lg"
          >
            Skip for now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
