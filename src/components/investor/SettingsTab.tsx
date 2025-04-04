import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck } from "lucide-react";
import { AccountVerificationBadge } from "@/components/verification/AccountVerificationBadge";
import { VerificationPrompt } from "@/components/verification/VerificationPrompt";
import { useNavigate } from "react-router-dom";
import { ProfilePictureUpload } from "@/components/shared/ProfilePictureUpload";

export const SettingsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: ""
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newMatches: true,
    marketUpdates: true,
    weeklyDigest: true
  });
  
  const [investmentPreferences, setInvestmentPreferences] = useState({
    minInvestment: "250000",
    maxInvestment: "2000000",
    preferredStages: ["Pre-seed", "Seed", "Series A"],
    preferredSectors: ["AI & ML", "Fintech", "Healthcare", "CleanTech"]
  });
  
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedType, setVerifiedType] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

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
      
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('investor_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!preferencesError && preferencesData) {
        setPreferences({
          emailNotifications: preferencesData.email_notifications || true,
          pushNotifications: preferencesData.push_notifications || false,
          newMatches: preferencesData.new_matches || true,
          marketUpdates: preferencesData.market_updates || true,
          weeklyDigest: preferencesData.weekly_digest || true
        });
        
        setInvestmentPreferences({
          minInvestment: preferencesData.min_investment || "250000",
          maxInvestment: preferencesData.max_investment || "2000000",
          preferredStages: preferencesData.preferred_stages || ["Pre-seed", "Seed", "Series A"],
          preferredSectors: preferencesData.preferred_sectors || ["AI & ML", "Fintech", "Healthcare", "CleanTech"]
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveProfileData = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          company: profileData.company,
          position: profileData.position,
          phone: profileData.phone
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved."
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleGetVerified = () => {
    navigate("/verification");
  };

  const tabItems = [
    { id: "profile", label: "Profile" },
    { id: "verification", label: "Verification" },
    { id: "notifications", label: "Notifications" },
    { id: "investment", label: "Investment" },
    { id: "security", label: "Security" }
  ];

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
          {tabItems.map(tab => (
            <div 
              key={tab.id}
              className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                activeTab === tab.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        
        <div className="flex-1">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal and company information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ProfilePictureUpload 
                  currentAvatarUrl={avatarUrl} 
                  userName={profileData.name} 
                  onAvatarUpdate={(url) => setAvatarUrl(url)} 
                />
                
                <form onSubmit={(e) => { e.preventDefault(); saveProfileData(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="name">Full Name</label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={profileData.name} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="email">Email Address</label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={profileData.email} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="company">Company</label>
                      <Input 
                        id="company" 
                        name="company" 
                        value={profileData.company} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="position">Position</label>
                      <Input 
                        id="position" 
                        name="position" 
                        value={profileData.position} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="phone">Phone Number</label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </form>
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
                          Your account was verified on {new Date(verifiedAt!).toLocaleDateString()} as an {verifiedType}
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
                          <span className="text-sm">Startups will trust your profile more</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <VerificationPrompt 
                    onGetVerified={handleGetVerified}
                    userType="investor"
                  />
                )}
              </CardContent>
            </Card>
          )}
          
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
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        emailNotifications: checked
                      })}
                    />
                  </div>
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="new-matches">New matches</Label>
                      <Switch
                        id="new-matches"
                        checked={preferences.newMatches}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          newMatches: checked
                        })}
                        disabled={!preferences.emailNotifications}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="market-updates">Market updates</Label>
                      <Switch
                        id="market-updates"
                        checked={preferences.marketUpdates}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          marketUpdates: checked
                        })}
                        disabled={!preferences.emailNotifications}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Label htmlFor="weekly-digest">Weekly digest</Label>
                      <Switch
                        id="weekly-digest"
                        checked={preferences.weeklyDigest}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          weeklyDigest: checked
                        })}
                        disabled={!preferences.emailNotifications}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Push Notifications</h3>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences,
                        pushNotifications: checked
                      })}
                    />
                  </div>
                </div>

                <Button onClick={(e) => e.preventDefault()} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {activeTab === "investment" && (
            <Card>
              <CardHeader>
                <CardTitle>Investment Preferences</CardTitle>
                <CardDescription>
                  Control your investment preferences for better startup matching.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="minInvestment">
                      Minimum Investment ($)
                    </label>
                    <Input 
                      id="minInvestment" 
                      name="minInvestment" 
                      type="number" 
                      value={investmentPreferences.minInvestment} 
                      onChange={(e) => setInvestmentPreferences(prev => ({
                        ...prev, 
                        minInvestment: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="maxInvestment">
                      Maximum Investment ($)
                    </label>
                    <Input 
                      id="maxInvestment" 
                      name="maxInvestment" 
                      type="number" 
                      value={investmentPreferences.maxInvestment} 
                      onChange={(e) => setInvestmentPreferences(prev => ({
                        ...prev, 
                        maxInvestment: e.target.value
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Preferred Investment Stages
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"].map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          className={`px-3 py-1.5 text-xs rounded-md ${
                            investmentPreferences.preferredStages.includes(stage)
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => {
                            if (investmentPreferences.preferredStages.includes(stage)) {
                              setInvestmentPreferences(prev => ({
                                ...prev,
                                preferredStages: prev.preferredStages.filter(s => s !== stage)
                              }));
                            } else {
                              setInvestmentPreferences(prev => ({
                                ...prev,
                                preferredStages: [...prev.preferredStages, stage]
                              }));
                            }
                          }}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Preferred Sectors
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["AI & ML", "Fintech", "Healthcare", "CleanTech", "EdTech", "E-commerce", "SaaS", "AgriTech"].map((sector) => (
                        <button
                          key={sector}
                          type="button"
                          className={`px-3 py-1.5 text-xs rounded-md ${
                            investmentPreferences.preferredSectors.includes(sector)
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          onClick={() => {
                            if (investmentPreferences.preferredSectors.includes(sector)) {
                              setInvestmentPreferences(prev => ({
                                ...prev,
                                preferredSectors: prev.preferredSectors.filter(s => s !== sector)
                              }));
                            } else {
                              setInvestmentPreferences(prev => ({
                                ...prev,
                                preferredSectors: [...prev.preferredSectors, sector]
                              }));
                            }
                          }}
                        >
                          {sector}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
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
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="currentPassword">
                      Current Password
                    </label>
                    <Input id="currentPassword" name="currentPassword" type="password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="newPassword">
                      New Password
                    </label>
                    <Input id="newPassword" name="newPassword" type="password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" />
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Password updated",
                        description: "Your password has been changed successfully",
                      });
                    }}
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
