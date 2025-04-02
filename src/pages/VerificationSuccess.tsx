
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const VerificationSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const sessionId = searchParams.get("session_id");
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkVerificationStatus = async () => {
      try {
        // Check if the user is verified in their profile
        const { data, error } = await supabase
          .from("profiles")
          .select("verified, verified_at, verified_type")
          .eq("id", user.id)
          .single();
          
        if (!error && data && data.verified === true) {
          setVerified(true);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkVerificationStatus();
  }, [user, navigate, sessionId]);
  
  const handleGoToProfile = () => {
    navigate("/business/profile");
  };
  
  const handleGoToExplore = () => {
    navigate("/business");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p>Checking verification status...</p>
          </div>
        </main>
        <MinimalFooter />
      </div>
    );
  }
  
  if (!verified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <Card className="max-w-3xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Verification Processing</CardTitle>
                <CardDescription>
                  We're still processing your verification. This might take a few minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Please check back in a few minutes. Your account should be verified shortly.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button onClick={() => window.location.reload()}>Check Status</Button>
                <Button variant="outline" onClick={handleGoToExplore}>Go to Dashboard</Button>
              </CardFooter>
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
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto bg-accent/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Verification Successful!</CardTitle>
              <CardDescription>
                Your account has been successfully verified on Flubo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Verification Badge Activated</h3>
                    <p className="text-sm text-muted-foreground">
                      Your verified badge now appears next to your name throughout Flubo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Prioritized Visibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Your profile will now rank higher in search, feed, and match results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Enhanced Trust</h3>
                    <p className="text-sm text-muted-foreground">
                      Other users can now trust that your identity and business are legitimate.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center flex-wrap gap-4">
              <Button onClick={handleGoToProfile}>View Your Profile</Button>
              <Button variant="outline" onClick={handleGoToExplore}>Explore Flubo</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default VerificationSuccess;
