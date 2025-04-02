
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SettingsTab as InvestorSettingsTab } from "@/components/investor/SettingsTab";
import { SettingsTab as StartupSettingsTab } from "@/components/startup/SettingsTab";

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const { type } = useParams<{ type: string }>();

  useEffect(() => {
    if (user) {
      const fetchUserType = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setUserType(data.user_type);
        } catch (error) {
          console.error("Error fetching user type:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserType();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
        <MinimalFooter />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If type is provided in the URL, use that, otherwise use the fetched userType
  const effectiveType = type || userType;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences</p>
          </div>
          
          <div className="mb-8">
            {effectiveType === "investor" && <InvestorSettingsTab />}
            {effectiveType === "startup" && <StartupSettingsTab />}
            {!effectiveType && (
              <div className="text-center py-10">
                <p>User type not found. Please complete your profile setup.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <MinimalFooter />
    </div>
  );
};

export default SettingsPage;
