
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PartnershipProfile() {
  const { user, loading } = useAuth();
  const { id } = useParams();
  
  // Viewing own profile if no ID is provided
  const isOwnProfile = !id;

  // Redirect if not logged in and trying to view own profile
  if (!loading && !user && isOwnProfile) {
    return <Navigate to="/auth" />;
  }

  // Redirect if logged in but not a partnership account and trying to view own profile
  if (!loading && user && isOwnProfile && user.user_metadata?.user_type !== "partnership") {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold">Partnership Profile</h1>
              <p className="text-muted-foreground">
                {isOwnProfile 
                  ? "Manage your organization profile and partnership preferences."
                  : "View organization details and partnership information."}
              </p>
            </div>
            
            <div className="bg-accent/10 p-8 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">🚧 Coming Soon</h2>
              <p>
                We're currently building out the partnership profile section to help you showcase your
                organization and define your partnership preferences. Check back soon!
              </p>
              <div className="mt-4">
                <p>The partnership profile will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Organization information and overview</li>
                  <li>Industry focus and innovation interests</li>
                  <li>Partnership preferences and criteria</li>
                  <li>Success stories and active partnerships</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
