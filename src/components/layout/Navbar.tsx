
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu, X, User, MessageSquare, LayoutDashboard, Bell, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // Check if we're on an authenticated page
  const isAuthPage = location.pathname.includes("/auth");
  const isBusinessDashboard = location.pathname.includes("/business");
  const isInvestorDashboard = location.pathname.includes("/investor");
  const isDashboard = isBusinessDashboard || isInvestorDashboard;
  const isHomePage = !isDashboard && !isAuthPage;

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Don't show navbar on auth page
  if (isAuthPage) return null;

  // Handle logo click - direct to appropriate dashboard if logged in
  const handleLogoClick = (e) => {
    if (user) {
      e.preventDefault();
      // Check user type and navigate to appropriate dashboard
      const userMetadata = user.user_metadata;
      if (userMetadata?.user_type === "startup") {
        navigate("/business");
      } else if (userMetadata?.user_type === "investor") {
        navigate("/investor");
      }
    }
    // If not logged in, default Link behavior will navigate to "/"
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Navigation items - only show on home page
  const navItems = isHomePage
    ? [
        { name: "Home", href: "/" },
        { name: "Startups", href: "/startups" },
        { name: "Investors", href: "/investors" },
        { name: "About", href: "/about" },
      ]
    : [];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass-nav py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to={user ? (isBusinessDashboard ? "/business" : isInvestorDashboard ? "/investor" : "/") : "/"}
          className="flex items-center space-x-2 font-semibold text-lg"
          onClick={handleLogoClick}
        >
          <span className="text-accent">Flubo</span>
        </Link>

        {/* Desktop Navigation - Only shown on home page */}
        {isHomePage && (
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-accent"
                      : "text-foreground/80 hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side - Auth / Theme toggle / Dashboard/Profile/Messages icons */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {isDashboard && (
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={isBusinessDashboard ? "/business" : "/investor"}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        (location.pathname === "/business" || location.pathname === "/investor")
                          ? "bg-accent/20 text-accent" 
                          : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                      )}
                      aria-label="Dashboard"
                    >
                      <Grid3X3 size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Dashboard</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={isBusinessDashboard ? "/business/profile" : "/investor/profile"}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        location.pathname.includes("/profile") 
                          ? "bg-accent/20 text-accent" 
                          : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                      )}
                      aria-label="Profile"
                    >
                      <User size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Profile</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={isBusinessDashboard ? "/business/messages" : "/investor/messages"}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        location.pathname.includes("/messages") 
                          ? "bg-accent/20 text-accent" 
                          : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                      )}
                      aria-label="Messages"
                    >
                      <MessageSquare size={20} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Messages</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors text-foreground/80 hover:text-foreground hover:bg-background/80"
                      aria-label="Notifications"
                    >
                      <Bell size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          {!user && !loading && (
            <Button asChild size="sm" variant="accent">
              <Link to="/auth">
                Sign In
              </Link>
            </Button>
          )}

          {user && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-nav h-screen animate-fade-in">
          <nav className="container mx-auto px-4 py-8 flex flex-col space-y-6">
            {isHomePage && navItems.map((item) => {
              const isActive = location.pathname === item.href;
                
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-base font-medium py-2 transition-colors duration-200",
                    isActive
                      ? "text-accent"
                      : "text-foreground/80 hover:text-foreground"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
            
            {isDashboard && (
              <>
                <Link
                  to={isBusinessDashboard ? "/business" : "/investor"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <Grid3X3 size={18} />
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  to={isBusinessDashboard ? "/business/profile" : "/investor/profile"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                
                <Link
                  to={isBusinessDashboard ? "/business/messages" : "/investor/messages"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </Link>
                
                <button
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                </button>
              </>
            )}
            
            {!user && !loading && (
              <Link
                to="/auth"
                className="inline-flex h-10 px-4 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-medium transition-colors hover:bg-accent/90"
              >
                Sign In
              </Link>
            )}

            {user && (
              <button 
                className="inline-flex h-10 px-4 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/80"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
