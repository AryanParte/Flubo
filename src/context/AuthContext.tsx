
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userType: "startup" | "investor" | null; // Adding userType to the interface
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, userType: "startup" | "investor", name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"startup" | "investor" | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured] = useState(isSupabaseConfigured());
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user type if user exists
        if (currentSession?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', currentSession.user.id)
              .single();
            
            if (error) throw error;
            setUserType(data.user_type as "startup" | "investor");
          } catch (error) {
            console.error("Error fetching user type:", error);
            setUserType(null);
          }
        } else {
          setUserType(null);
        }
        
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch user type if user exists
      if (currentSession?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', currentSession.user.id)
            .single();
          
          if (error) throw error;
          setUserType(data.user_type as "startup" | "investor");
        } catch (error) {
          console.error("Error fetching user type:", error);
          setUserType(null);
        }
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  const signUp = async (
    email: string, 
    password: string, 
    userType: "startup" | "investor", 
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
          description: "Please check your email for a confirmation link to verify your account",
        });
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
        } else {
          setUserType(profileData.user_type as "startup" | "investor");
        }

        toast({
          title: "Welcome back",
          description: "You have successfully signed in",
        });

        const fetchedUserType = profileData?.user_type || "startup";
        navigate(fetchedUserType === "startup" ? "/business" : "/investor");
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
      
      setSession(null);
      setUser(null);
      setUserType(null);
      
      try {
        await supabase.auth.signOut();
      } catch (error: any) {
        console.log("Server signout error (proceeding anyway):", error);
      }
      
      navigate("/");
      
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "Please try again or refresh the page",
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
        userType,
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
