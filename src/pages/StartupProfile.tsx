
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const StartupProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

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
          const profileId = params.id || (user ? user.id : null);
          
          if (!profileId) {
            setProfileExists(false);
            return;
          }

          const { data, error } = await supabase
            .from('startup_profiles')
            .select('id')
            .eq('id', profileId)
            .maybeSingle();

          if (error && error.code !== 'PGRST116') {
            console.error("Error checking profile:", error);
            toast({
              title: "Error",
              description: "Could not verify startup profile",
              variant: "destructive"
            });
            setProfileExists(false);
          } else {
            setProfileExists(!!data);
          }
        } catch (error) {
          console.error("Error in profile check:", error);
          setProfileExists(false);
        } finally {
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
