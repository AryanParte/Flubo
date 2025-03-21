
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: "startup" | "investor", name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    userType: "startup" | "investor", 
    name: string
  ) => {
    try {
      setLoading(true);
      
      // Create the user account
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

      if (error) throw error;

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              user_type: userType,
              name: name,
              email: email,
            },
          ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast({
            title: "Profile creation failed",
            description: profileError.message,
            variant: "destructive",
          });
        }

        toast({
          title: "Account created",
          description: "You have successfully created an account",
        });
        
        // Redirect based on user type
        navigate(userType === "startup" ? "/startup" : "/investor");
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile to determine user type
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }

        toast({
          title: "Welcome back",
          description: "You have successfully signed in",
        });

        // Redirect based on user type from profile
        const userType = profileData?.user_type || "startup";
        navigate(userType === "startup" ? "/startup" : "/investor");
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
