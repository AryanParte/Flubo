
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { LogOut, Bell, Shield, CreditCard } from "lucide-react";

export const SettingsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");
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
  
  const handleSaveNotifications = async () => {
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
        title: "Preferences saved",
        description: "Your notification settings have been updated",
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
  
  const handleSwitchChange = (settingType: 'email' | 'push', id: string) => {
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
      
      // Redirect will be handled by AuthContext
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const renderNotificationsSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Notification Settings</h2>
          <p className="text-muted-foreground text-sm mb-4">Control which notifications you receive</p>
          
          <div className="space-y-8">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive email notifications</p>
                </div>
                <Switch
                  checked={Object.values(emailSettings).some(Boolean)}
                  onCheckedChange={(checked) => {
                    const updatedSettings: typeof emailSettings = {
                      'new-match': checked,
                      'messages': checked,
                      'profile-views': checked,
                      'funding-updates': checked,
                      'newsletters': checked,
                    };
                    setEmailSettings(updatedSettings);
                  }}
                />
              </div>
              
              <div className="pl-1 space-y-4 border-l-2 border-border/30">
                {[
                  { id: "new-match", label: "New investor matches", checked: emailSettings['new-match'] },
                  { id: "messages", label: "New messages", checked: emailSettings['messages'] },
                  { id: "profile-views", label: "Profile views", checked: emailSettings['profile-views'] },
                  { id: "funding-updates", label: "Funding updates", checked: emailSettings['funding-updates'] },
                  { id: "newsletters", label: "Platform newsletters", checked: emailSettings['newsletters'] },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch 
                      checked={item.checked}
                      onCheckedChange={() => handleSwitchChange('email', item.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Push Notifications */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive push notifications on this device</p>
                </div>
                <Switch
                  checked={Object.values(pushSettings).some(Boolean)}
                  onCheckedChange={(checked) => {
                    const updatedSettings: typeof pushSettings = {
                      'push-matches': checked,
                      'push-messages': checked,
                      'push-reminders': checked,
                    };
                    setPushSettings(updatedSettings);
                  }}
                />
              </div>
              
              <div className="pl-1 space-y-4 border-l-2 border-border/30">
                {[
                  { id: "push-matches", label: "New investor matches", checked: pushSettings['push-matches'] },
                  { id: "push-messages", label: "New messages", checked: pushSettings['push-messages'] },
                  { id: "push-reminders", label: "Meeting reminders", checked: pushSettings['push-reminders'] },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch 
                      checked={item.checked}
                      onCheckedChange={() => handleSwitchChange('push', item.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveNotifications} disabled={loading}>
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    );
  };

  const renderSecuritySection = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-1">Security Settings</h2>
          <p className="text-muted-foreground text-sm mb-4">Manage your account security and privacy</p>

          {/* Two-Factor Authentication */}
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <Switch 
                  checked={false} 
                  onCheckedChange={() => {
                    toast({
                      title: "Feature coming soon",
                      description: "Two-factor authentication will be available soon"
                    });
                  }}
                />
              </div>
            </div>

            {/* Account Login Alerts */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Account Login Alerts</h3>
                  <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                </div>
                <Switch 
                  checked={true}
                  onCheckedChange={() => {
                    toast({
                      title: "Setting updated",
                      description: "Login alert preferences updated"
                    });
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Change your password</p>
                </div>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Feature coming soon",
                    description: "Password change functionality will be available soon"
                  });
                }}>
                  Change Password
                </Button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="space-y-2 pt-6 border-t border-border/40">
              <div>
                <h3 className="text-base font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <div className="pt-2">
                <Button variant="destructive" onClick={() => {
                  toast({
                    title: "Warning",
                    description: "Account deletion requires verification. Please contact support.",
                    variant: "destructive",
                  });
                }}>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionSection = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Subscription Plan</h2>
          <p className="text-muted-foreground text-sm mb-6">Manage your subscription and billing information</p>
          
          <div className="space-y-8">
            {/* Current Plan */}
            <div className="p-5 border border-border/50 rounded-lg bg-background/30">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-medium">Free Plan</h3>
                  <p className="text-sm text-muted-foreground">Basic access to investor matching</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">Current Plan</span>
                </div>
                <Button variant="outline" onClick={() => {
                  toast({
                    title: "Upgrade",
                    description: "Upgrade options coming soon"
                  });
                }}>
                  Upgrade
                </Button>
              </div>
            </div>
            
            <h3 className="text-base font-medium">Available Plans</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Startup Growth Plan */}
              <div className="p-5 border border-border/50 rounded-lg bg-background/30">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Startup Growth</h4>
                    <span className="font-medium">$49/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Enhanced visibility to investors</p>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Unlimited investor connections
                    </li>
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Priority listing in search
                    </li>
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Access to funding events
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "This plan will be available soon"
                    });
                  }}>
                    Select Plan
                  </Button>
                </div>
              </div>
              
              {/* Startup Pro Plan */}
              <div className="p-5 border border-border/50 rounded-lg bg-background/30 relative">
                <div className="absolute -top-2 right-4 px-2 py-0.5 text-xs bg-accent text-accent-foreground rounded-full">
                  Popular
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Startup Pro</h4>
                    <span className="font-medium">$99/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Complete fundraising solution</p>
                  <ul className="space-y-2">
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Everything in Growth
                    </li>
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Investor introductions
                    </li>
                    <li className="text-sm flex items-center">
                      <span className="mr-2 bg-accent rounded-full w-1.5 h-1.5"></span>
                      Pitch deck review
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => {
                    toast({
                      title: "Coming soon",
                      description: "This plan will be available soon"
                    });
                  }}>
                    Select Plan
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium">Payment Methods</h3>
                <Button variant="ghost" size="sm" className="text-sm" onClick={() => {
                  toast({
                    title: "Coming soon",
                    description: "Payment method management will be available soon"
                  });
                }}>
                  + Add New
                </Button>
              </div>
              
              <div className="p-5 border border-border/50 rounded-lg bg-background/30 text-center">
                <p className="text-sm text-muted-foreground mb-3">No payment methods added yet</p>
                <Button variant="outline" size="sm" onClick={() => {
                  toast({
                    title: "Coming soon",
                    description: "Adding payment methods will be available soon"
                  });
                }}>
                  Add a payment method
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'notifications':
        return renderNotificationsSection();
      case 'security':
        return renderSecuritySection();
      case 'subscription':
        return renderSubscriptionSection();
      default:
        return renderNotificationsSection();
    }
  };
  
  return (
    <div className="min-h-[70vh] bg-background text-foreground">
      <div className="pb-6">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="md:w-64 space-y-1">
          {[
            { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
            { id: 'security', label: 'Security', icon: <Shield size={18} /> },
            { id: 'subscription', label: 'Subscription', icon: <CreditCard size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center w-full text-left px-4 py-2.5 rounded-md transition-colors ${
                activeSection === item.id 
                  ? 'bg-accent/20 text-foreground border-l-2 border-accent' 
                  : 'text-muted-foreground hover:bg-accent/10'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          
          <div className="pt-2 mt-6 border-t border-border/40">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left px-4 py-2.5 rounded-md transition-colors text-red-500 hover:bg-red-500/10"
            >
              <LogOut size={18} className="mr-3" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-6 bg-background/40 border border-border/40 rounded-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
