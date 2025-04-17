import React, { useState, useEffect } from "react";
import { User, Bell, Sliders, Shield, MessageSquare, Loader2, UserCheck, TrendingUp, Award } from "lucide-react";
import { AIPersonaErrorHandler } from "./AIPersonaErrorHandler";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ProfilePictureUpload } from "@/components/shared/ProfilePictureUpload";
import { Investor } from "@/types/investor";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";
import { useProfile } from "@/context/ProfileContext";

const VerificationTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [verifiedType, setVerifiedType] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);
  
  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('verified, verified_at, verified_type')
        .eq('id', user?.id)
        .single();
        
      if (error) throw error;
      
      setIsVerified(!!data?.verified);
      setVerifiedAt(data?.verified_at);
      setVerifiedType(data?.verified_type);
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGetVerified = () => {
    navigate("/verification");
  };
  
  if (loading) {
    return (
      <Card className="bg-card-dark">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (isVerified) {
    return (
      <Card className="bg-card-dark">
        <CardHeader>
          <CardTitle>Account Verification</CardTitle>
          <CardDescription>
            Your account is verified on Flubo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-accent/10 rounded-lg">
              <div className="mr-4 bg-accent/20 w-12 h-12 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-lg flex items-center">
                  Verified Account
                  <AccountVerificationBadge verified size="md" userId={user?.id} />
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your account was verified on {verifiedAt && new Date(verifiedAt).toLocaleDateString()} as an {verifiedType}
                </p>
              </div>
            </div>
            
            <h4 className="font-medium mt-6">Benefits you're enjoying:</h4>
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
                <span>Priority matching with startups</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-card-dark">
      <CardHeader>
        <CardTitle>Account Verification</CardTitle>
        <CardDescription>
          Verify your account to build trust and get prioritized in search results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg border border-white/10 bg-black/20 p-6">
            <div className="flex justify-center items-center mb-3">
              <UserCheck className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-xl font-medium">Get Verified on Flubo</h3>
            </div>
            <p className="text-center text-muted-foreground mb-6">
              Build trust and get discovered faster with a verified account badge.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-black/30 p-4 rounded-lg">
                <Shield className="h-8 w-8 mb-2 text-green-500" />
                <h4 className="font-medium mb-1">Build Trust</h4>
                <p className="text-sm text-muted-foreground">
                  Show other users that your identity and business are legitimate
                </p>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg">
                <TrendingUp className="h-8 w-8 mb-2 text-green-500" />
                <h4 className="font-medium mb-1">Rank Higher</h4>
                <p className="text-sm text-muted-foreground">
                  Get prioritized in search results, feed, and match rankings
                </p>
              </div>
              
              <div className="bg-black/30 p-4 rounded-lg">
                <Award className="h-8 w-8 mb-2 text-green-500" />
                <h4 className="font-medium mb-1">Stand Out</h4>
                <p className="text-sm text-muted-foreground">
                  Display your verified badge across all platform interactions
                </p>
              </div>
            </div>
            
            <div className="text-center py-4 mb-6">
              <div className="text-3xl font-bold mb-2">$20</div>
              <div className="text-sm text-muted-foreground">One-time verification fee</div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleGetVerified} 
                size="lg"
                className="px-8"
              >
                Get Verified
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AccountSettings = () => {
  const { user } = useAuth();
  const { profile: contextProfile, updateProfile } = useProfile();
  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    bio: "",
    company: "",
    position: "",
    location: "",
    avatar_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, contextProfile]);

  const fetchProfile = async () => {
    if (contextProfile) {
      setProfile({
        id: contextProfile.id,
        name: contextProfile.name || "",
        email: contextProfile.email || "",
        bio: contextProfile.bio || "",
        company: contextProfile.company || "",
        position: contextProfile.position || "",
        location: contextProfile.location || "",
        avatar_url: contextProfile.avatar_url || ""
      });
      setLoading(false);
      return;
    }

    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile({
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        bio: data.bio || "",
        company: data.company || "",
        position: data.position || "",
        location: data.location || "",
        avatar_url: data.avatar_url || ""
      });
      
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      await updateProfile({
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        company: profile.company,
        position: profile.position,
        location: profile.location,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => ({ ...prev, avatar_url: url }));
  };
  
  if (loading) {
    return (
      <Card className="bg-card-dark">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-card-dark">
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <ProfilePictureUpload 
              currentAvatarUrl={profile.avatar_url} 
              userName={profile.name} 
              onAvatarUpdate={handleAvatarUpdate}
            />
            
            <div className="space-y-4 flex-1">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={profile.name || ""} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={profile.email || ""} 
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              value={profile.bio || ""} 
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
              className="h-24"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input 
                id="company" 
                value={profile.company || ""} 
                onChange={(e) => setProfile({...profile, company: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Input 
                id="position" 
                value={profile.position || ""} 
                onChange={(e) => setProfile({...profile, position: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={profile.location || ""} 
                onChange={(e) => setProfile({...profile, location: e.target.value})}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleProfileUpdate} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

const NotificationSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailMatches: true,
    emailMessages: true,
    emailDigest: true,
    browserMatches: true,
    browserMessages: true,
    mobileMatches: false,
    mobileMessages: false,
  });

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('investor_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          emailMatches: data.new_matches || true,
          emailMessages: data.email_notifications || true,
          emailDigest: data.weekly_digest || true,
          browserMatches: data.push_notifications || false,
          browserMessages: data.push_notifications || false,
          mobileMatches: data.push_notifications || false,
          mobileMessages: data.push_notifications || false,
        });
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('investor_preferences')
        .upsert({
          user_id: user.id,
          new_matches: settings.emailMatches,
          email_notifications: settings.emailMessages,
          weekly_digest: settings.emailDigest,
          push_notifications: settings.browserMatches || settings.browserMessages,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card-dark">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-dark">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Manage your notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailMatches">New matches</Label>
                <p className="text-sm text-muted-foreground">Get emails when you match with a startup</p>
              </div>
              <Switch 
                id="emailMatches" 
                checked={settings.emailMatches}
                onCheckedChange={(checked) => setSettings({...settings, emailMatches: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailMessages">Messages</Label>
                <p className="text-sm text-muted-foreground">Get emails about new messages</p>
              </div>
              <Switch 
                id="emailMessages" 
                checked={settings.emailMessages}
                onCheckedChange={(checked) => setSettings({...settings, emailMessages: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailDigest">Weekly digest</Label>
                <p className="text-sm text-muted-foreground">Get a weekly summary of platform activity</p>
              </div>
              <Switch 
                id="emailDigest" 
                checked={settings.emailDigest}
                onCheckedChange={(checked) => setSettings({...settings, emailDigest: checked})}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Browser Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="browserMatches">Matches</Label>
                <p className="text-sm text-muted-foreground">Get browser notifications for new matches</p>
              </div>
              <Switch 
                id="browserMatches" 
                checked={settings.browserMatches}
                onCheckedChange={(checked) => setSettings({...settings, browserMatches: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="browserMessages">Messages</Label>
                <p className="text-sm text-muted-foreground">Get browser notifications for new messages</p>
              </div>
              <Switch 
                id="browserMessages" 
                checked={settings.browserMessages}
                onCheckedChange={(checked) => setSettings({...settings, browserMessages: checked})}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Mobile Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mobileMatches">Matches</Label>
                <p className="text-sm text-muted-foreground">Get mobile notifications for new matches</p>
              </div>
              <Switch 
                id="mobileMatches" 
                checked={settings.mobileMatches}
                onCheckedChange={(checked) => setSettings({...settings, mobileMatches: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mobileMessages">Messages</Label>
                <p className="text-sm text-muted-foreground">Get mobile notifications for new messages</p>
              </div>
              <Switch 
                id="mobileMessages" 
                checked={settings.mobileMessages}
                onCheckedChange={(checked) => setSettings({...settings, mobileMessages: checked})}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveNotificationSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Notification Preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

const InvestmentPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<{
    preferred_sectors: string[];
    preferred_stages: string[];
    min_investment: string;
    max_investment: string;
  }>({
    preferred_sectors: [],
    preferred_stages: [],
    min_investment: "",
    max_investment: "",
  });

  const sectors = [
    "AI & ML", "Fintech", "Healthcare", "CleanTech", "E-commerce",
    "SaaS", "EdTech", "AgTech", "BioTech", "Cybersecurity"
  ];
  
  const stages = [
    "Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"
  ];

  useEffect(() => {
    if (user) {
      loadInvestmentPreferences();
    }
  }, [user]);

  const loadInvestmentPreferences = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('investor_preferences')
        .select('preferred_sectors, preferred_stages, min_investment, max_investment')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setPreferences({
          preferred_sectors: data.preferred_sectors || [],
          preferred_stages: data.preferred_stages || [],
          min_investment: data.min_investment || "",
          max_investment: data.max_investment || "",
        });
      }
    } catch (error) {
      console.error("Error loading investment preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load investment preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveInvestmentPreferences = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('investor_preferences')
        .upsert({
          user_id: user.id,
          preferred_sectors: preferences.preferred_sectors,
          preferred_stages: preferences.preferred_stages,
          min_investment: preferences.min_investment,
          max_investment: preferences.max_investment,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast({
        title: "Preferences Saved",
        description: "Your investment preferences have been updated",
      });
    } catch (error) {
      console.error("Error saving investment preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save investment preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSector = (sector: string) => {
    setPreferences(prev => {
      if (prev.preferred_sectors.includes(sector)) {
        return {
          ...prev,
          preferred_sectors: prev.preferred_sectors.filter(s => s !== sector)
        };
      } else {
        return {
          ...prev,
          preferred_sectors: [...prev.preferred_sectors, sector]
        };
      }
    });
  };

  const toggleStage = (stage: string) => {
    setPreferences(prev => {
      if (prev.preferred_stages.includes(stage)) {
        return {
          ...prev,
          preferred_stages: prev.preferred_stages.filter(s => s !== stage)
        };
      } else {
        return {
          ...prev,
          preferred_stages: [...prev.preferred_stages, stage]
        };
      }
    });
  };

  if (loading) {
    return (
      <Card className="bg-card-dark">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-dark">
      <CardHeader>
        <CardTitle>Investment Preferences</CardTitle>
        <CardDescription>Define your investment criteria</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base font-medium">Investment Sectors</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select the sectors you're interested in investing in
          </p>
          <div className="flex flex-wrap gap-2">
            {sectors.map(sector => (
              <Button
                key={sector}
                variant={preferences.preferred_sectors.includes(sector) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSector(sector)}
                className="rounded-full"
              >
                {sector}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-base font-medium">Preferred Stages</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select the funding stages you're typically interested in
          </p>
          <div className="flex flex-wrap gap-2">
            {stages.map(stage => (
              <Button
                key={stage}
                variant={preferences.preferred_stages.includes(stage) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleStage(stage)}
                className="rounded-full"
              >
                {stage}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-base font-medium">Investment Range</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Define your typical investment amount range
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min-investment">Minimum ($)</Label>
              <Input
                id="min-investment"
                value={preferences.min_investment}
                onChange={(e) => setPreferences({...preferences, min_investment: e.target.value})}
                placeholder="e.g. 25000"
              />
            </div>
            <div>
              <Label htmlFor="max-investment">Maximum ($)</Label>
              <Input
                id="max-investment"
                value={preferences.max_investment}
                onChange={(e) => setPreferences({...preferences, max_investment: e.target.value})}
                placeholder="e.g. 100000"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveInvestmentPreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Investment Preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  
  const handlePasswordChange = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your new password and confirmation match",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });
      
      // Clear the form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card className="bg-card-dark">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Update your password and security preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="current-password">Current Password</Label>
          <Input 
            id="current-password" 
            type="password" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="new-password">New Password</Label>
          <Input 
            id="new-password" 
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input 
            id="confirm-password" 
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePasswordChange} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const SettingsTab = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ai-persona' ? 'ai-persona' : 'verification';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-64">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold mb-6">Settings</h3>
          <div className="space-y-1">
            {[
              { id: 'verification', label: 'Verification', icon: UserCheck },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'preferences', label: 'Investment Preferences', icon: Sliders },
              { id: 'ai-persona', label: 'AI Persona', icon: MessageSquare },
              { id: 'security', label: 'Security', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                className={`flex items-center w-full space-x-3 px-4 py-3 rounded-md text-base ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        {activeTab === 'verification' && (
          <VerificationTab />
        )}
        
        {activeTab === 'notifications' && (
          <NotificationSettings />
        )}
        
        {activeTab === 'preferences' && (
          <InvestmentPreferences />
        )}
        
        {activeTab === 'ai-persona' && (
          <AIPersonaErrorHandler />
        )}
        
        {activeTab === 'security' && (
          <SecuritySettings />
        )}
      </div>
    </div>
  );
};
