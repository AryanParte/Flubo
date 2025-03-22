
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const StartupProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not authenticated and auth check is complete
    if (!authLoading && !user && !params.id) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate, params.id]);

  useEffect(() => {
    const checkProfileExists = async () => {
      if (!authLoading && (user || params.id)) {
        try {
          setCheckingProfile(true);
          setError(null);
          const profileId = params.id || (user ? user.id : null);
          
          if (!profileId) {
            setProfileExists(false);
            setCheckingProfile(false);
            return;
          }

          // First check if the user exists in the profiles table
          const { data: userProfile, error: userProfileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', profileId)
            .maybeSingle();

          if (userProfileError) {
            console.error("Error checking user profile:", userProfileError);
            setError("Could not verify user profile");
            setCheckingProfile(false);
            return;
          }

          // If user doesn't exist in profiles table, we can't create a startup profile
          if (!userProfile) {
            console.error("User profile doesn't exist in profiles table");
            setError("User profile not found. Please complete your account setup first.");
            setCheckingProfile(false);
            return;
          }

          // Now check if startup profile exists
          const { data, error } = await supabase
            .from('startup_profiles')
            .select('id')
            .eq('id', profileId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error("Error checking startup profile:", error);
            setError("Could not verify startup profile");
            setCheckingProfile(false);
          } else {
            setProfileExists(!!data);
            setCheckingProfile(false);
          }
        } catch (error) {
          console.error("Error in profile check:", error);
          setError("An unexpected error occurred");
          setCheckingProfile(false);
        }
      } else if (!authLoading && !user && params.id) {
        // Viewing someone else's profile while not logged in
        setCheckingProfile(false);
      }
    };

    checkProfileExists();
  }, [user, authLoading, params.id]);

  // Show loading state while checking authentication
  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/")} variant="outline">Go Home</Button>
              {user && <Button onClick={() => navigate("/startup")}>Dashboard</Button>}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold mb-8">Company Profile</h1>
          {(!user && !params.id) ? (
            <div>Please log in to view your profile</div>
          ) : (
            <ProfileTab key={params.id || (user ? user.id : 'visitor')} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupProfile;
