
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SettingsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    'new-match': true,
    'messages': true,
    'profile-views': false,
    'funding-updates': true,
    'newsletters': false,
  });
  
  const [pushSettings, setPushSettings] = useState({
    'push-matches': true,
    'push-messages': true,
    'push-reminders': true,
  });
  
  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user]);
  
  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('startup_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine for new users
        throw error;
      }
      
      if (data) {
        setEmailSettings({
          'new-match': data.email_new_match ?? true,
          'messages': data.email_messages ?? true,
          'profile-views': data.email_profile_views ?? false,
          'funding-updates': data.email_funding_updates ?? true,
          'newsletters': data.email_newsletters ?? false,
        });
        
        setPushSettings({
          'push-matches': data.push_matches ?? true,
          'push-messages': data.push_messages ?? true,
          'push-reminders': data.push_reminders ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('startup_notification_settings')
        .upsert({
          user_id: user.id,
          email_new_match: emailSettings['new-match'],
          email_messages: emailSettings['messages'],
          email_profile_views: emailSettings['profile-views'],
          email_funding_updates: emailSettings['funding-updates'],
          email_newsletters: emailSettings['newsletters'],
          push_matches: pushSettings['push-matches'],
          push_messages: pushSettings['push-messages'],
          push_reminders: pushSettings['push-reminders'],
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckboxChange = (settingType: 'email' | 'push', id: string) => {
    if (settingType === 'email') {
      setEmailSettings(prev => ({
        ...prev,
        [id]: !prev[id as keyof typeof prev]
      }));
    } else {
      setPushSettings(prev => ({
        ...prev,
        [id]: !prev[id as keyof typeof prev]
      }));
    }
  };

  return (
    <div>
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
            
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Email Notifications</h3>
                
                {[
                  { id: "new-match", label: "New investor matches", checked: emailSettings['new-match'] },
                  { id: "messages", label: "New messages", checked: emailSettings['messages'] },
                  { id: "profile-views", label: "Profile views", checked: emailSettings['profile-views'] },
                  { id: "funding-updates", label: "Funding updates", checked: emailSettings['funding-updates'] },
                  { id: "newsletters", label: "Platform newsletters", checked: emailSettings['newsletters'] },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange('email', item.id)}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Push Notifications</h3>
                
                {[
                  { id: "push-matches", label: "New investor matches", checked: pushSettings['push-matches'] },
                  { id: "push-messages", label: "New messages", checked: pushSettings['push-messages'] },
                  { id: "push-reminders", label: "Meeting reminders", checked: pushSettings['push-reminders'] },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange('push', item.id)}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Notification Preferences"}
              </Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Account Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-4">Email Address</h3>
                <div className="flex items-center gap-3">
                  <input 
                    type="email"
                    defaultValue="" 
                    placeholder="Not set"
                    readOnly 
                    className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({
                      title: "Change email",
                      description: "Email change functionality coming soon",
                    });
                  }}>
                    Change
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4">Password</h3>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({
                    title: "Change password",
                    description: "Password change functionality coming soon",
                  });
                }}>
                  Change Password
                </Button>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4">Subscription Plan</h3>
                <div className="p-4 border border-border rounded-md bg-background/40 max-w-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Free Plan</p>
                      <p className="text-sm text-muted-foreground">Basic features</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "Upgrade subscription",
                        description: "Subscription management coming soon",
                      });
                    }}>
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-4 text-destructive">Danger Zone</h3>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Deactivate account",
                      description: "This action cannot be undone",
                      variant: "destructive",
                    });
                  }}
                >
                  Deactivate Account
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
