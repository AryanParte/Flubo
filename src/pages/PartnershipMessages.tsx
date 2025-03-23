
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PartnershipMessages() {
  const { user, loading } = useAuth();

  // Redirect if not logged in or not a partnership account
  if (!loading && (!user || user.user_metadata?.user_type !== "partnership")) {
    return <Navigate to="/auth" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col space-y-8">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-muted-foreground">
                Connect with startups and manage your ongoing conversations.
              </p>
            </div>
            
            <div className="bg-accent/10 p-8 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">🚧 Coming Soon</h2>
              <p>
                We're currently building the messaging system to facilitate seamless communication
                between partnerships and startups. Check back soon!
              </p>
              <div className="mt-4">
                <p>The messaging system will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Direct messaging with startup founders</li>
                  <li>Attachment sharing and document collaboration</li>
                  <li>Meeting scheduling and integration</li>
                  <li>Message organization and search capabilities</li>
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
