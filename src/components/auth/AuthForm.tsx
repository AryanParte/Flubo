import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

type UserType = "startup" | "investor";
type AuthMode = "signin" | "signup";

export function AuthForm() {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as UserType) || "startup";
  const [userType, setUserType] = useState<UserType>(initialType);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const navigate = useNavigate();
  const { signIn, signUp, loading, supabaseConfigured } = useAuth();

  useEffect(() => {
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      setIsSubmitting(false);
    }
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSubmitting || !supabaseConfigured) {
      console.log("Form submission prevented: isSubmitting=", isSubmitting, "supabaseConfigured=", supabaseConfigured);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (authMode === "signin") {
        console.log("Attempting sign in for:", email);
        const result = await signIn(email, password);
        console.log("Sign in result:", result);
        
        if (!result.success) {
          console.error("Sign in failed:", result.error);
          setError(result.error || "An unknown error occurred during sign in");
          setIsSubmitting(false);
        }
      } else {
        if (!name.trim()) {
          toast({
            title: "Name is required",
            description: "Please enter your name to create an account",
            variant: "destructive",
          });
          setError("Name is required");
          setIsSubmitting(false);
          return;
        }
        console.log("Attempting sign up for:", email, "as", userType);
        await signUp(email, password, userType, name);
        setEmailSent(true); // Set email sent state to true after signup
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      setError(error.message || "An unknown error occurred");
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
      
      {!supabaseConfigured && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Supabase is not properly configured. Authentication will not work until environment variables are set.
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {emailSent && (
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            We've sent a confirmation email to {email}. Please check your inbox and click the link to verify your account.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">
          {emailSent 
            ? "Check your email" 
            : authMode === "signin" 
              ? "Welcome back" 
              : "Create your account"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {emailSent 
            ? "Verify your email to complete registration" 
            : authMode === "signin" 
              ? "Sign in to access your account" 
              : "Join our platform and get connected"}
        </p>
      </div>
      
      {/* User Type Selector */}
      {!emailSent && (
        <div className="bg-background/50 p-1 rounded-lg border border-border mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setUserType("startup")}
              className={cn(
                "py-2.5 px-4 text-sm font-medium rounded-md transition-all",
                userType === "startup"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Business
            </button>
            <button
              type="button"
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
      )}
      
      {!emailSent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "signup" && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {userType === "startup" ? "Company Name" : "Full Name"}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder={userType === "startup" ? "Your company name" : "Your name"}
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="email@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="••••••••"
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
            disabled={loading || isSubmitting || !supabaseConfigured}
            className={cn(
              "w-full h-10 rounded-md bg-accent text-accent-foreground text-sm font-medium transition-transform hover:scale-[1.02]",
              (loading || isSubmitting || !supabaseConfigured) && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading || isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {authMode === "signin" ? "Signing In..." : "Creating Account..."}
              </span>
            ) : (
              <>{authMode === "signin" ? "Sign In" : "Create Account"}</>
            )}
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-4">
          <button
            onClick={() => {
              setEmailSent(false);
              setEmail("");
              setPassword("");
              setName("");
              setAuthMode("signin");
            }}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
          >
            Back to sign in
          </button>
        </div>
      )}
      
      {!emailSent && (
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => {
              setAuthMode(authMode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-accent hover:underline"
          >
            {authMode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      )}
    </div>
  );
}
