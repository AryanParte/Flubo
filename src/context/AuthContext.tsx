
import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type UserType = "startup" | "investor" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType;
  loading: boolean;
  supabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signUp: (email: string, password: string, userType: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseConfigured] = useState(isSupabaseConfigured());
  const navigate = useNavigate();

  // Initialize auth and listen for auth state changes
  useEffect(() => {
    if (!supabaseConfigured) {
      console.log("Supabase not configured, skipping auth initialization");
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        handleSessionChange(data.session);
      } catch (error) {
        console.error("Error getting initial session:", error);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    // Fix: Store the unsubscribe function correctly based on Supabase's API
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event);
      handleSessionChange(session);
      
      // Handle sign in and sign out events
      if (event === 'SIGNED_IN') {
        console.log("User signed in, redirecting to appropriate dashboard");
        // Don't navigate here, let the handleSessionChange function determine where to redirect
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, navigating to home page");
        navigate('/');
      }
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      // Fix: Call the correct unsubscribe method
      subscription?.unsubscribe();
    };
  }, [supabaseConfigured, navigate]);

  // Handle session changes and fetch user profile data
  const handleSessionChange = async (newSession: Session | null) => {
    console.log("Handling session change:", newSession ? "Session exists" : "No session");
    setSession(newSession);
    
    if (newSession?.user) {
      setUser(newSession.user);
      
      try {
        // Get user profile to determine user type
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", newSession.user.id)
          .maybeSingle();
          
        if (error) {
          console.error("Error getting user profile:", error);
          setUserType(null);
        } else if (profile) {
          console.log("User profile found:", profile);
          setUserType(profile.user_type as UserType);
          
          // Navigate to appropriate dashboard based on user type
          if (profile.user_type === "investor") {
            navigate('/investor');
          } else if (profile.user_type === "startup") {
            navigate('/business');
          }
        } else {
          console.log("No profile found for user");
          setUserType(null);
        }
      } catch (error) {
        console.error("Error processing user profile:", error);
        setUserType(null);
      }
    } else {
      setUser(null);
      setUserType(null);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting sign in for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error.message);
        return { success: false, error: error.message };
      }
      
      console.log("Sign in successful:", data);
      return { success: true, error: null };
    } catch (error: any) {
      console.error("Unexpected sign in error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userType: string, name: string) => {
    try {
      setLoading(true);
      console.log("Signing up new user:", email, "as", userType);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            name: name,
          },
        },
      });
      
      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }
      
      console.log("Sign up successful, user created:", data);
      
      // Create profile record
      if (data?.user) {
        try {
          // Try inserting the profile
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            user_type: userType,
            name: name,
            email: email,
          });
          
          if (profileError) {
            console.error("Error creating profile:", profileError);
            // Profile creation failed, but user was created
            // We'll handle this when they sign in
          } else {
            console.log("Profile created successfully");
          }
        } catch (profileError) {
          console.error("Error in profile creation:", profileError);
        }
      }
    } catch (error: any) {
      console.error("Sign up process error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      console.log("User signed out");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    userType,
    loading,
    supabaseConfigured,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
