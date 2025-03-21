
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu, X, User, MessageSquare, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Check if we're on an authenticated page
  const isAuthPage = location.pathname.includes("/auth");
  const isStartupDashboard = location.pathname.includes("/startup");
  const isInvestorDashboard = location.pathname.includes("/investor");
  const isDashboard = isStartupDashboard || isInvestorDashboard;

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

  // Navigation items
  const navItems = isDashboard
    ? []
    : [
        { name: "Home", href: "/" },
        { name: "Startups", href: "/startups" },
        { name: "Investors", href: "/investors" },
        { name: "About", href: "/about" },
      ];

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
          to="/" 
          className="flex items-center space-x-2 font-semibold text-lg"
        >
          <span className="text-accent">Venture</span>
          <span>Match</span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Right side - Auth / Theme toggle / Dashboard/Profile/Messages icons */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {isDashboard && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={isStartupDashboard ? "/startup" : "/investor"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      (location.pathname === "/startup" || location.pathname === "/investor")
                        ? "bg-accent/20 text-accent" 
                        : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                    )}
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard size={18} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Dashboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isDashboard && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={isStartupDashboard ? "/startup/profile" : "/investor/profile"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      location.pathname.includes("/profile") 
                        ? "bg-accent/20 text-accent" 
                        : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                    )}
                    aria-label="Profile"
                  >
                    <User size={18} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Profile</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isDashboard && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={isStartupDashboard ? "/startup/messages" : "/investor/messages"}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      location.pathname.includes("/messages") 
                        ? "bg-accent/20 text-accent" 
                        : "text-foreground/80 hover:text-foreground hover:bg-background/80"
                    )}
                    aria-label="Messages"
                  >
                    <MessageSquare size={18} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {!isDashboard && (
            <Link
              to="/auth"
              className="hidden md:inline-flex h-9 px-4 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-medium transition-colors duration-200 hover:bg-accent/90"
            >
              Sign In
            </Link>
          )}

          {isDashboard && (
            <button 
              className="hidden md:inline-flex h-9 px-4 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/80"
              onClick={() => {
                console.log("Sign out");
                // Sign out logic would go here
              }}
            >
              Sign Out
            </button>
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
            {navItems.map((item) => {
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
                  to={isStartupDashboard ? "/startup" : "/investor"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  to={isStartupDashboard ? "/startup/profile" : "/investor/profile"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                
                <Link
                  to={isStartupDashboard ? "/startup/messages" : "/investor/messages"}
                  className="flex items-center space-x-2 text-base font-medium py-2 transition-colors duration-200"
                >
                  <MessageSquare size={18} />
                  <span>Messages</span>
                </Link>
              </>
            )}
            
            {!isDashboard && (
              <Link
                to="/auth"
                className="inline-flex h-10 px-4 items-center justify-center rounded-md bg-accent text-accent-foreground text-sm font-medium transition-colors hover:bg-accent/90"
              >
                Sign In
              </Link>
            )}

            {isDashboard && (
              <button 
                className="inline-flex h-10 px-4 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-medium transition-colors hover:bg-secondary/80"
                onClick={() => {
                  console.log("Sign out");
                  // Sign out logic would go here
                }}
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
