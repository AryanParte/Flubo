import React, { useState, useEffect } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, LogOut, Settings, User, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, user_type, verified")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error);
          return;
        }

        if (data) {
          setUserName(data.name);
          setUserType(data.user_type);
          setVerified(data.verified || false);
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Generate dashboard path based on user type
  const getDashboardPath = () => {
    return userType === "investor" ? "/investor" : "/business";
  };

  const getProfilePath = () => {
    return userType === "investor" ? "/investor/profile" : "/business/profile";
  };

  const getMessagesPath = () => {
    return userType === "investor" ? "/investor/messages" : "/business/messages";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl text-accent">Flubo</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <NavLink
                  to={getDashboardPath()}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/70 hover:text-foreground"
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to={getMessagesPath()}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/70 hover:text-foreground"
                    }`
                  }
                >
                  Messages
                </NavLink>
                {userType === "investor" ? (
                  <NavLink
                    to="/startups"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "text-accent"
                          : "text-foreground/70 hover:text-foreground"
                      }`
                    }
                  >
                    Startups
                  </NavLink>
                ) : (
                  <NavLink
                    to="/investors"
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "text-accent"
                          : "text-foreground/70 hover:text-foreground"
                      }`
                    }
                  >
                    Investors
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/70 hover:text-foreground"
                    }`
                  }
                >
                  About
                </NavLink>
                <NavLink
                  to="/startups"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/70 hover:text-foreground"
                    }`
                  }
                >
                  Startups
                </NavLink>
                <NavLink
                  to="/investors"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/70 hover:text-foreground"
                    }`
                  }
                >
                  Investors
                </NavLink>
              </>
            )}
          </nav>

          {/* Right Side - Auth State */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative rounded-full h-8 w-8 flex items-center justify-center"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {userName
                            ? userName.charAt(0).toUpperCase()
                            : user.email?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {verified && (
                        <div className="absolute bottom-0 right-0">
                          <AccountVerificationBadge verified={true} size="sm" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <span>{userName || user.email}</span>
                      {verified && <AccountVerificationBadge verified={true} size="sm" />}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={getProfilePath()} className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`${getDashboardPath()}?tab=settings`} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {!verified && (
                      <DropdownMenuItem asChild>
                        <Link to="/verification" className="flex items-center">
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Get Verified</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMenu}>
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden border-t border-border/40">
          <div className="container mx-auto px-4 pb-3">
            {user ? (
              <div className="space-y-1 pt-3">
                <Link
                  to={getDashboardPath()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to={getMessagesPath()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  Messages
                </Link>
                <Link
                  to={userType === "investor" ? "/startups" : "/investors"}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  {userType === "investor" ? "Startups" : "Investors"}
                </Link>
                <Link
                  to={getProfilePath()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  Profile
                </Link>
                {!verified && (
                  <Link
                    to="/verification"
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                    onClick={toggleMenu}
                  >
                    Get Verified
                  </Link>
                )}
                <button
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={() => {
                    handleSignOut();
                    toggleMenu();
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-1 pt-3">
                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  About
                </Link>
                <Link
                  to="/startups"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  Startups
                </Link>
                <Link
                  to="/investors"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground"
                  onClick={toggleMenu}
                >
                  Investors
                </Link>
                <Link
                  to="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
