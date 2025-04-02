
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

type UserType = "startup" | "investor";
type AuthMode = "signin" | "signup";

export function useAuthForm(initialType: UserType) {
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
  
  const { loading, supabaseConfigured, signIn, signUp } = useAuth();
  
  // Reset form state when component mounts
  useEffect(() => {
    setIsSubmitting(false);
  }, []);

  // Reset submitting state when auth mode changes
  useEffect(() => {
    setIsSubmitting(false);
    setError(null);
  }, [authMode]);

  // Track loading state from auth context
  useEffect(() => {
    console.log("Auth loading state changed:", loading);
    if (!loading && isSubmitting) {
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
      console.log("Form submission started with authMode:", authMode);
      
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
  
  const resetForm = () => {
    setEmailSent(false);
    setEmail("");
    setPassword("");
    setName("");
    setAuthMode("signin");
  };

  return {
    userType,
    setUserType,
    authMode,
    setAuthMode,
    showPassword,
    setShowPassword,
    isSubmitting,
    setIsSubmitting,
    emailSent,
    setEmailSent,
    error,
    setError,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    handleSubmit,
    resetForm,
    loading,
    supabaseConfigured
  };
}
