
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfileTab } from "@/components/startup/ProfileTab";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const StartupProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated and auth check is complete
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
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
          {user ? <ProfileTab /> : <div>Please log in to view your profile</div>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StartupProfile;
