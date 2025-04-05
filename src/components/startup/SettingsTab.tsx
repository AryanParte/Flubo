
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";
import { VerificationPrompt } from "@/components/verification/VerificationPrompt";
import { useNavigate } from "react-router-dom";
import { ProfilePictureUpload } from "@/components/shared/ProfilePictureUpload";

export const SettingsTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  const [activeTab, setActiveTab] = useState("verification");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedType, setVerifiedType] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
  });
  
  const [startupProfile, setStartupProfile] = useState({
    bio: "",
    tagline: "",
    website: "",
    location: "",
    founded: "",
    employees: "",
    industry: "",
    stage: "",
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewMatch: true,
    emailMessages: true,
    emailProfileViews: false,
    emailFundingUpdates: true,
    emailNewsletters: false,
    pushMatches: true,
    pushMessages: true,
    pushReminders: true,
  });
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, verified, verified_at, verified_type, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      if (profileData) {
        setProfileData({
          name: profileData.name || "",
          email: profileData.email || user.email || "",
          company: profileData.company || "",
          position: profileData.position || "",
          phone: profileData.phone || ""
        });
        
        setAvatarUrl(profileData.avatar_url);
        setIsVerified(!!profileData.verified);
        setVerifiedType(profileData.verified_type);
        setVerifiedAt(profileData.verified_at);
      }
      
      const { data: startupData, error: startupError } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!startupError && startupData) {
        setStartupProfile({
          bio: startupData.bio || "",
          tagline: startupData.tagline || "",
          website: startupData.website || "",
          location: startupData.location || "",
          founded: startupData.founded || "",
          employees: startupData.employees || "",
          industry: startupData.industry || "",
          stage: startupData.stage || "",
        });
      }
      
      const { data: notificationData, error: notificationError } = await supabase
        .from('startup_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!notificationError && notificationData) {
        setNotificationSettings({
          emailNewMatch: notificationData.email_new_match || true,
          emailMessages: notificationData.email_messages || true,
          emailProfileViews: notificationData.email_profile_views || false,
          emailFundingUpdates: notificationData.email_funding_updates || true,
          emailNewsletters: notificationData.email_newsletters || false,
          pushMatches: notificationData.push_matches || true,
          pushMessages: notificationData.push_messages || true,
          pushReminders: notificationData.push_reminders || true
        });
      }
      
      setProfileLoaded(true);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update basic profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          company: profileData.company,
          position: profileData.position,
          phone: profileData.phone
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Update startup profile
      const { error: startupError } = await supabase
        .from('startup_profiles')
        .upsert({
          id: user.id,
          bio: startupProfile.bio,
          tagline: startupProfile.tagline,
          website: startupProfile.website,
          location: startupProfile.location,
          founded: startupProfile.founded,
          employees: startupProfile.employees,
          industry: startupProfile.industry,
          stage: startupProfile.stage
        });
        
      if (startupError) throw startupError;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('startup_notification_settings')
        .upsert({
          user_id: user.id,
          email_new_match: notificationSettings.emailNewMatch,
          email_messages: notificationSettings.emailMessages,
          email_profile_views: notificationSettings.emailProfileViews,
          email_funding_updates: notificationSettings.emailFundingUpdates,
          email_newsletters: notificationSettings.emailNewsletters,
          push_matches: notificationSettings.pushMatches,
          push_messages: notificationSettings.pushMessages,
          push_reminders: notificationSettings.pushReminders
        });
        
      if (error) throw error;
      
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleAvatarUpdate = (url: string) => {
    setAvatarUrl(url);
  };
  
  const handleGetVerified = () => {
    navigate("/verification");
  };
  
  if (loading && !profileLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6">
        <TabsTrigger value="verification">Verification</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      <TabsContent value="verification">
        <Card>
          <CardHeader>
            <CardTitle>Account Verification</CardTitle>
            <CardDescription>
              Verify your business account to build trust and get prioritized
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-accent/10 rounded-lg">
                  <div className="mr-4 bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg flex items-center">
                      Verified Account
                      <AccountVerificationBadge verified size="md" />
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your account was verified on {verifiedAt && new Date(verifiedAt).toLocaleDateString()} as a {verifiedType}
                    </p>
                  </div>
                </div>
                
                <h4 className="font-medium mt-6">Benefits of verification:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-primary mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Higher visibility in search results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-primary mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Verification badge on your profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-primary mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority matching with investors</span>
                  </li>
                </ul>
              </div>
            ) : (
              <VerificationPrompt 
                onGetVerified={handleGetVerified}
                userType="startup"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Control how and when you receive updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-new-match">New matches</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you match with an investor</p>
                  </div>
                  <Switch 
                    id="email-new-match"
                    checked={notificationSettings.emailNewMatch}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      emailNewMatch: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-messages">New messages</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new messages from investors</p>
                  </div>
                  <Switch 
                    id="email-messages"
                    checked={notificationSettings.emailMessages}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      emailMessages: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-profile-views">Profile views</Label>
                    <p className="text-sm text-muted-foreground">Get notified when an investor views your profile</p>
                  </div>
                  <Switch 
                    id="email-profile-views"
                    checked={notificationSettings.emailProfileViews}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      emailProfileViews: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-funding-updates">Funding updates</Label>
                    <p className="text-sm text-muted-foreground">Get updates about funding opportunities</p>
                  </div>
                  <Switch 
                    id="email-funding-updates"
                    checked={notificationSettings.emailFundingUpdates}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      emailFundingUpdates: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-newsletters">Newsletters</Label>
                    <p className="text-sm text-muted-foreground">Receive our monthly newsletter</p>
                  </div>
                  <Switch 
                    id="email-newsletters"
                    checked={notificationSettings.emailNewsletters}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      emailNewsletters: checked
                    })}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Push Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-matches">Matches</Label>
                    <p className="text-sm text-muted-foreground">Get notified for new investor matches</p>
                  </div>
                  <Switch 
                    id="push-matches"
                    checked={notificationSettings.pushMatches}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      pushMatches: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-messages">Messages</Label>
                    <p className="text-sm text-muted-foreground">Get notified for new messages</p>
                  </div>
                  <Switch 
                    id="push-messages"
                    checked={notificationSettings.pushMessages}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      pushMessages: checked
                    })}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-reminders">Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified about activity reminders</p>
                  </div>
                  <Switch 
                    id="push-reminders"
                    checked={notificationSettings.pushReminders}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      pushReminders: checked
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveNotifications} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notification Settings"
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage your password and account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>
              Update Password
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
