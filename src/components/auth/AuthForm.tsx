
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type UserType = "startup" | "investor";
type AuthMode = "signin" | "signup";

export function AuthForm() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as UserType) || "startup";
  const [userType, setUserType] = useState<UserType>(initialType);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (authMode === "signin") {
        await signIn(email, password, userType);
      } else {
        await signUp(email, password, userType, name);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-scale-in">
      <div className="mb-8">
        <button 
          onClick={() => navigate("/")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Home
        </button>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">
          {authMode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {authMode === "signin" 
            ? "Sign in to access your account" 
            : "Join our platform and get connected"
          }
        </p>
      </div>
      
      {/* User Type Selector */}
      <div className="bg-background/50 p-1 rounded-lg border border-border mb-6">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setUserType("startup")}
            className={cn(
              "py-2.5 px-4 text-sm font-medium rounded-md transition-all",
              userType === "startup"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Startup
          </button>
          <button
            onClick={() => setUserType("investor")}
            className={cn(
              "py-2.5 px-4 text-sm font-medium rounded-md transition-all",
              userType === "investor"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Investor
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {authMode === "signup" && (
          <>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {userType === "startup" ? "Company Name" : "Full Name"}
              </label>
              <input
                id="name"
                type="text"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder={userType === "startup" ? "Your startup name" : "Your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            {authMode === "signin" && (
              <a href="#" className="text-xs text-accent hover:underline">
                Forgot password?
              </a>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full h-10 rounded-md bg-accent text-accent-foreground text-sm font-medium transition-transform hover:scale-[1.02]",
            isSubmitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <span className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
              {authMode === "signin" ? "Signing In..." : "Creating Account..."}
            </span>
          ) : (
            <>{authMode === "signin" ? "Sign In" : "Create Account"}</>
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
        </span>
        <button
          onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
          className="text-accent hover:underline"
        >
          {authMode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </div>
    </div>
  );
}
