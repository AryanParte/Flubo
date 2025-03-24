
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
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

const queryClient = new QueryClient();

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
