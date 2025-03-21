
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, User, getCurrentUser } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, userType: 'startup' | 'investor') => Promise<void>;
  signUp: (email: string, password: string, userType: 'startup' | 'investor', name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'SIGNED_IN' && session) {
        const user = await getCurrentUser();
        setUser(user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, userType: 'startup' | 'investor') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // Give a little time for the auth state to update
      setTimeout(async () => {
        const user = await getCurrentUser();
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Check if user type matches
        if (user.user_type !== userType) {
          await supabase.auth.signOut();
          throw new Error(`Incorrect account type. Please sign in as a ${userType}.`);
        }
        
        setUser(user);
        
        // Redirect based on user type
        navigate(userType === 'startup' ? '/startup' : '/investor');
        
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      }, 500);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: error.message || 'Failed to sign in',
      });
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: 'startup' | 'investor', name: string) => {
    try {
      setLoading(true);
      
      // Create the user in Supabase Auth with metadata
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            user_type: userType,
            name: name
          }
        }
      });
      
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');
      
      // Important: With email confirmation enabled, we need to check if the user is confirmed
      // before trying to insert into profiles
      if (data.session) {
        // User is immediately confirmed (email confirmation is disabled)
        // We can safely create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              user_type: userType,
              name: name,
              email: email,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw new Error(`Error creating profile: ${profileError.message}`);
        }
        
        // Get user and redirect
        const user = await getCurrentUser();
        setUser(user);
        
        if (user) {
          navigate(userType === 'startup' ? '/startup' : '/investor');
        }
      } else {
        // Email confirmation is required, so we just show a message
        toast({
          title: 'Registration successful!',
          description: 'Please check your email to confirm your account. The profile will be created once you confirm your email.',
        });
      }
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration error',
        description: error.message || 'Failed to sign up',
      });
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      navigate('/');
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error signing out',
        description: error.message || 'Failed to sign out',
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
