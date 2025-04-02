
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StartupDashboard from "./pages/StartupDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import StartupProfile from "./pages/StartupProfile";
import InvestorProfile from "./pages/InvestorProfile";
import StartupMessages from "./pages/StartupMessages";
import InvestorMessages from "./pages/InvestorMessages";
import Startups from "./pages/Startups";
import Investors from "./pages/Investors";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import SinglePost from "./pages/SinglePost";
import Verification from "./pages/Verification";
import VerificationSuccess from "./pages/VerificationSuccess";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

// Redirect component that checks user type and redirects to appropriate dashboard
function HomeRedirect() {
  const { user, userType } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("HomeRedirect: user:", user?.id, "userType:", userType);
  }, [user, userType]);

  if (!user) {
    // If not logged in, redirect to index
    return <Navigate to="/" replace />;
  }
  
  if (userType === "investor") {
    // Redirect investor to investor dashboard
    return <Navigate to="/investor" replace state={{ from: location }} />;
  } else if (userType === "startup") {
    // Redirect startup to business dashboard
    return <Navigate to="/business" replace state={{ from: location }} />;
  }
  
  // If userType is not determined yet, show a loading state or redirect to index
  return <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<HomeRedirect />} />
              <Route path="/business" element={<StartupDashboard />} />
              <Route path="/investor" element={<InvestorDashboard />} />
              <Route path="/business/profile" element={<StartupProfile />} />
              <Route path="/business/profile/:id" element={<StartupProfile />} />
              <Route path="/investor/profile" element={<InvestorProfile />} />
              <Route path="/investor/profile/:id" element={<InvestorProfile />} />
              <Route path="/business/messages" element={<StartupMessages />} />
              <Route path="/investor/messages" element={<InvestorMessages />} />
              <Route path="/startups" element={<Startups />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/about" element={<About />} />
              <Route path="/post/:id" element={<SinglePost />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/verification-success" element={<VerificationSuccess />} />
              <Route path="/settings/:type" element={<SettingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Redirect for legacy routes */}
              <Route path="/startup/*" element={<Navigate to="/business/*" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
