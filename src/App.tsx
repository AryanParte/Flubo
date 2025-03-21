
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StartupDashboard from "./pages/StartupDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import StartupProfile from "./pages/StartupProfile";
import InvestorProfile from "./pages/InvestorProfile";
import StartupMessages from "./pages/StartupMessages";
import InvestorMessages from "./pages/InvestorMessages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Startup Routes */}
              <Route element={<ProtectedRoute userType="startup" />}>
                <Route path="/startup" element={<StartupDashboard />} />
                <Route path="/startup/profile" element={<StartupProfile />} />
                <Route path="/startup/messages" element={<StartupMessages />} />
              </Route>
              
              {/* Protected Investor Routes */}
              <Route element={<ProtectedRoute userType="investor" />}>
                <Route path="/investor" element={<InvestorDashboard />} />
                <Route path="/investor/profile" element={<InvestorProfile />} />
                <Route path="/investor/messages" element={<InvestorMessages />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
