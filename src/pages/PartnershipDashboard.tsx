
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PartnershipDashboard() {
  const { user, loading } = useAuth();
  const [activeTab] = useState("overview");

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
              <h1 className="text-3xl font-bold">Partnership Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome to your partnership dashboard! Here you can discover and connect with innovative startups.
              </p>
            </div>
            
            <div className="bg-accent/10 p-8 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">🚧 Coming Soon</h2>
              <p>
                We're currently building out the partnership dashboard with exciting features to help you discover, 
                connect with, and collaborate alongside innovative startups. Check back soon!
              </p>
              <div className="mt-4">
                <p>In the meantime, you can:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Complete your organization profile</li>
                  <li>Browse our curated list of startups</li>
                  <li>Reach out to our team for personalized startup introductions</li>
                </ul>
              </div>
            </div>
            
            {activeTab === "overview" && (
              <div className="grid gap-8">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-background p-6 rounded-lg border border-border/50">
                    <h3 className="text-lg font-medium mb-1">Profile Completion</h3>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">0%</span>
                      <span className="text-muted-foreground ml-2">Complete</span>
                    </div>
                  </div>
                  
                  <div className="bg-background p-6 rounded-lg border border-border/50">
                    <h3 className="text-lg font-medium mb-1">Startup Discoveries</h3>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">0</span>
                      <span className="text-muted-foreground ml-2">Viewed</span>
                    </div>
                  </div>
                  
                  <div className="bg-background p-6 rounded-lg border border-border/50">
                    <h3 className="text-lg font-medium mb-1">Active Partnerships</h3>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">0</span>
                      <span className="text-muted-foreground ml-2">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
