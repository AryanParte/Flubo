
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, userType: "startup" | "investor" | "partnership", name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured] = useState(isSupabaseConfigured());
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  const signUp = async (
    email: string, 
    password: string, 
    userType: "startup" | "investor" | "partnership", 
    name: string
  ) => {
    if (!supabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (existingUser) {
        toast({
          title: "Account already exists",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
        return;
      }
      
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
        console.log("User created successfully, now creating profile");
        
        // Using type assertion to help TypeScript understand the parameter structure
        const { error: profileError } = await supabase.functions.invoke(
          'create_profile',
          {
            body: {
              profile_id: data.user.id,
              profile_user_type: userType,
              profile_name: name,
              profile_email: email
            }
          }
        );

        if (profileError) {
          console.error("Error creating profile:", profileError);
          toast({
            title: "Profile creation failed",
            description: profileError.message,
            variant: "destructive",
          });
          
          await supabase.auth.admin.deleteUser(data.user.id);
          
          return;
        }

        console.log("Profile created successfully");
        
        if (userType === "startup") {
          const { error: startupProfileError } = await supabase
            .from("startup_profiles")
            .insert([
              {
                id: data.user.id,
                name: name,
                industry: "Technology",
              },
            ]);

          if (startupProfileError) {
            console.error("Error creating startup profile:", startupProfileError);
          } else {
            console.log("Basic startup profile created");
          }
        }

        toast({
          title: "Account created",
          description: "You have successfully created an account",
        });
        
        navigate(
          userType === "startup" 
            ? "/startup" 
            : userType === "investor" 
              ? "/investor" 
              : "/partnership"
        );
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
    if (!supabaseConfigured) {
      toast({
        title: "Configuration Error",
        description: "Supabase is not properly configured. Please check your environment variables.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
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

        const userType = profileData?.user_type || "startup";
        navigate(
          userType === "startup" 
            ? "/startup" 
            : userType === "investor" 
              ? "/investor" 
              : "/partnership"
        );
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
    if (!supabaseConfigured) {
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } else {
        console.log("No active session found, redirecting to home page");
      }
      
      setSession(null);
      setUser(null);
      navigate("/");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
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
        supabaseConfigured,
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
