
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, Building, User, ArrowLeft } from "lucide-react";
import { VerificationForm } from "@/components/verification/VerificationForm";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const Verification = () => {
  const [userType, setUserType] = useState<"startup" | "investor">("startup");
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Check if the user is already verified
    const checkVerificationStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("verified")
          .eq("id", user.id)
          .single();
          
        if (!error && data && data.verified === true) {
          setIsVerified(true);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };
    
    checkVerificationStatus();
    
    // Also try to determine the user type
    const checkUserType = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single();
          
        if (!error && data && data.user_type) {
          setUserType(data.user_type === "investor" ? "investor" : "startup");
        }
      } catch (error) {
        console.error("Error checking user type:", error);
      }
    };
    
    checkUserType();
  }, [user, navigate]);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  if (isVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1" 
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
            <Card className="max-w-3xl mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto bg-accent/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <UserCheck className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl">Your Account is Verified!</CardTitle>
                <CardDescription>
                  You're all set! Your account is now verified on Flubo.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Your verification badge is now active and visible across the platform. 
                  Your profile will be prioritized in searches, feeds, and matching.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <MinimalFooter />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-8 text-center">Verify Your Account</h1>
            
            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
                <CardDescription>
                  {userType === "investor" 
                    ? "Complete this form to verify your investor account for $20"
                    : "Complete this form to verify your business account for $10"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VerificationForm userType={userType} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default Verification;
