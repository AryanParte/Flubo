import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

type ProfileData = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  avatar_url: string | null;
  user_type: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ProfileContextType = {
  profile: ProfileData | null;
  loading: boolean;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  // Set up real-time subscription to profile changes
  useEffect(() => {
    if (!user) return;

    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfile((prev) => {
            if (!prev) return payload.new as ProfileData;
            return { ...prev, ...payload.new };
          });
          
          // Notify user that profile was updated
          toast({
            title: 'Profile Updated',
            description: 'Your profile information has been updated',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, [user, toast]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Update local state immediately for better UX
      setProfile({ ...profile, ...updates });
      
      // If we update company name, also update it in startup_profiles if exists
      if (updates.company && profile.user_type === 'startup') {
        try {
          await supabase
            .from('startup_profiles')
            .update({ name: updates.company })
            .eq('id', user.id);
        } catch (err) {
          console.error('Error updating startup_profiles name:', err);
        }
      }
      
      // If updating investor title or company, also update in investor_profiles if exists
      if ((updates.company || updates.position) && profile.user_type === 'investor') {
        const { data: investorPrefs } = await supabase
          .from('investor_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (investorPrefs) {
          const updates: any = {};
          if (updates.company) updates.company = updates.company;
          if (updates.position) updates.position = updates.position;
          
          try {
            await supabase
              .from('investor_preferences')
              .update(updates)
              .eq('user_id', user.id);
          } catch (err) {
            console.error('Error updating investor_preferences:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    return fetchProfile();
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}; 