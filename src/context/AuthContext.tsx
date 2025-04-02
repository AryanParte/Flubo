
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userType: "startup" | "investor" | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, userType: "startup" | "investor", name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean, error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"startup" | "investor" | null>(null);
  const [loading, setLoading] = useState(false);
  const [supabaseConfigured] = useState(isSupabaseConfigured());
  const navigate = useNavigate();

  console.log("AuthProvider initializing");

  useEffect(() => {
    if (!supabaseConfigured) {
      console.log("Supabase not configured, skipping auth initialization");
      return;
    }

    console.log("Setting up auth state change listener");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, "User:", currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch user type if user exists
        if (currentSession?.user) {
          try {
            console.log("Fetching user type for:", currentSession.user.id);
            const { data, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', currentSession.user.id)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching user type:", error);
              setUserType(null);
            } else if (data) {
              console.log("User type fetched:", data.user_type);
              setUserType(data.user_type as "startup" | "investor");
            } else {
              console.log("No user profile found");
              setUserType(null);
            }
          } catch (error) {
            console.error("Error fetching user type:", error);
            setUserType(null);
          }
        } else {
          setUserType(null);
        }
      }
    );

    // Initial session check
    console.log("Checking for existing session");
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Session found" : "No session");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch user type if user exists
      if (currentSession?.user) {
        try {
          console.log("Fetching initial user type for:", currentSession.user.id);
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', currentSession.user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching initial user type:", error);
            setUserType(null);
          } else if (data) {
            console.log("Initial user type fetched:", data.user_type);
            setUserType(data.user_type as "startup" | "investor");
          } else {
            console.log("No initial user profile found");
            setUserType(null);
          }
        } catch (error) {
          console.error("Error fetching initial user type:", error);
          setUserType(null);
        }
      }
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, [supabaseConfigured, navigate]);

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
      console.log("Signing up user:", email, "as", userType);
      
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
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (data.user) {
        console.log("User created successfully, now creating profile for:", data.user.id);
        
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
      throw error;
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
      return { success: false, error: "Supabase not configured" };
    }

    try {
      setLoading(true);
      console.log("Signing in user:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log("User signed in successfully:", data.user.id);
        
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          // Still continue as the authentication was successful
        } else if (profileData) {
          console.log("Profile fetched:", profileData);
          setUserType(profileData.user_type as "startup" | "investor");
        } else {
          console.log("No profile found for user, attempting to create one");
          // Try to create a profile if it doesn't exist
          try {
            const { error: createProfileError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: data.user.id,
                  user_type: data.user.user_metadata.user_type || "startup",
                  name: data.user.user_metadata.name || email,
                  email: email,
                }
              ]);
              
            if (createProfileError) {
              console.error("Error creating missing profile:", createProfileError);
            } else {
              console.log("Created missing profile for user");
              setUserType((data.user.user_metadata.user_type as "startup" | "investor") || "startup");
            }
          } catch (createError) {
            console.error("Error in profile creation:", createError);
          }
        }

        toast({
          title: "Welcome back",
          description: "You have successfully signed in",
        });

        const fetchedUserType = profileData?.user_type || data.user.user_metadata.user_type || "startup";
        console.log("Redirecting to:", fetchedUserType === "startup" ? "/business" : "/investor");
        navigate(fetchedUserType === "startup" ? "/business" : "/investor");
        return { success: true };
      } else {
        console.error("Sign in returned no user");
        return { success: false, error: "No user returned from sign in" };
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
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
      console.log("Signing out user");
      
      setSession(null);
      setUser(null);
      setUserType(null);
      
      try {
        await supabase.auth.signOut();
        console.log("Server sign out successful");
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
