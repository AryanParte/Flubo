
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
      
      const user = await getCurrentUser();
      
      if (!user) throw new Error('User not found');
      
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
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: error.message || 'Failed to sign in',
      });
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userType: 'startup' | 'investor', name: string) => {
    try {
      setLoading(true);
      
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      if (!data.user) throw new Error('Failed to create user');
      
      // Add the user profile with additional data
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
      
      if (profileError) throw profileError;
      
      // If using email confirmation, notify user
      toast({
        title: 'Registration successful!',
        description: 'Please check your email to confirm your account.',
      });
      
      // If using auto sign-in, get user and redirect
      const user = await getCurrentUser();
      setUser(user);
      
      if (user) {
        navigate(userType === 'startup' ? '/startup' : '/investor');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration error',
        description: error.message || 'Failed to sign up',
      });
    } finally {
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
