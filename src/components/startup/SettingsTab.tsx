import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";
import { VerificationPrompt } from "@/components/verification/VerificationPrompt";
import { useNavigate } from "react-router-dom";

export const SettingsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedType, setVerifiedType] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const navigate = useNavigate();

  // Email notification settings
  const [emailSettings, setEmailSettings] = useState<{
    'new-match': boolean;
    'messages': boolean;
    'profile-views': boolean;
    'funding-updates': boolean;
    'newsletters': boolean;
  }>({
    'new-match': true,
    'messages': true,
    'profile-views': false,
    'funding-updates': true,
    'newsletters': false,
  });

  // Push notification settings
  const [pushSettings, setPushSettings] = useState<{
    'push-matches': boolean;
    'push-messages': boolean;
    'push-reminders': boolean;
  }>({
    'push-matches': true,
    'push-messages': true,
    'push-reminders': true,
  });

  // Security settings
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load user settings from database
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("verified, verified_at, verified_type")
          .eq("id", user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else if (profileData) {
          setIsVerified(!!profileData.verified);
          setVerifiedType(profileData.verified_type);
          setVerifiedAt(profileData.verified_at);
        }
          
        const { data, error } = await supabase
          .from("startup_notification_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setEmailSettings({
            'new-match': data.email_new_match,
            'messages': data.email_messages,
            'profile-views': data.email_profile_views,
            'funding-updates': data.email_funding_updates,
            'newsletters': data.email_newsletters,
          });

          setPushSettings({
            'push-matches': data.push_matches,
            'push-messages': data.push_messages,
            'push-reminders': data.push_reminders,
          });
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({
          title: "Error",
          description: "Failed to load your settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Listen for realtime updates to settings
  useRealtimeSubscription<any>(
    'startup_notification_settings',
    ['UPDATE'],
    ({ new: newData }) => {
      if (newData && user && newData.user_id === user.id) {
        setEmailSettings({
          'new-match': newData.email_new_match,
          'messages': newData.email_messages,
          'profile-views': newData.email_profile_views,
          'funding-updates': newData.email_funding_updates,
          'newsletters': newData.email_newsletters,
        });

        setPushSettings({
          'push-matches': newData.push_matches,
          'push-messages': newData.push_messages,
          'push-reminders': newData.push_reminders,
        });
      }
    }
  );

  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("startup_notification_settings")
        .upsert({
          user_id: user.id,
          email_new_match: emailSettings['new-match'],
          email_messages: emailSettings.messages,
          email_profile_views: emailSettings['profile-views'],
          email_funding_updates: emailSettings['funding-updates'],
          email_newsletters: emailSettings.newsletters,
          push_matches: pushSettings['push-matches'],
          push_messages: pushSettings['push-messages'],
          push_reminders: pushSettings['push-reminders'],
        });

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change your password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleGetVerified = () => {
    navigate("/verification");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64 space-y-2">
          <div 
            className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${activeTab === "notifications" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </div>
          <div 
            className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${activeTab === "verification" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
            onClick={() => setActiveTab("verification")}
          >
            Verification
          </div>
          <div 
            className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${activeTab === "security" ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </div>
        </div>
        
        <div className="flex-1">
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Control how and when you receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
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
                  <Separator />
                  
                  <div className="space-y-3">
                    {Object.entries(emailSettings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`email-${key}`} className="flex-grow">
                          {key === 'new-match' && 'New matches'}
                          {key === 'messages' && 'Messages'}
                          {key === 'profile-views' && 'Profile views'}
                          {key === 'funding-updates' && 'Funding updates'}
                          {key === 'newsletters' && 'Newsletters'}
                        </Label>
                        <Switch
                          id={`email-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setEmailSettings({
                              ...emailSettings,
                              [key]: checked,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Push Notifications</h3>
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
                  <Separator />
                  
                  <div className="space-y-3">
                    {Object.entries(pushSettings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <Label htmlFor={`push-${key}`} className="flex-grow">
                          {key === 'push-matches' && 'New matches'}
                          {key === 'push-messages' && 'Messages'}
                          {key === 'push-reminders' && 'Reminders'}
                        </Label>
                        <Switch
                          id={`push-${key}`}
                          checked={value}
                          onCheckedChange={(checked) =>
                            setPushSettings({
                              ...pushSettings,
                              [key]: checked,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={saveNotificationSettings} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {activeTab === "verification" && (
            <Card>
              <CardHeader>
                <CardTitle>Account Verification</CardTitle>
                <CardDescription>
                  Verify your account to build trust and get prioritized in search results.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isVerified ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          Verified Account
                          <AccountVerificationBadge verified size="md" />
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your account was verified on {new Date(verifiedAt!).toLocaleDateString()} as a {verifiedType}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Verification Benefits</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="mt-1 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                          </div>
                          <span className="text-sm">Your profile displays a verification badge</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="mt-1 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                          </div>
                          <span className="text-sm">Your profile is prioritized in search results and matches</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="mt-1 h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                          </div>
                          <span className="text-sm">Other users will trust your profile more</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <VerificationPrompt 
                    onGetVerified={handleGetVerified}
                    userType="startup"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={changePassword}
                    disabled={saving || !password || !newPassword || !confirmPassword}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
