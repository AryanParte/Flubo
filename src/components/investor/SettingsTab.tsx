
import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export const SettingsTab = () => {
  const [profileData, setProfileData] = useState({
    name: "Alex Morgan",
    email: "alex@venturecp.com",
    company: "Venture Capital Partners",
    position: "Investment Partner",
    phone: "+1 (555) 123-4567"
  });
  
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
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };
  
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been updated",
    });
  };
  
  const handleSaveInvestmentPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Investment preferences updated",
      description: "Your investment preferences have been updated",
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [name]: !prev[name] }));
  };
  
  return (
    <div>
      <h2 className="text-lg font-medium mb-6">Account Settings</h2>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="investment">Investment Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-md font-medium mb-4">Personal Information</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="name">Full Name</label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={profileData.name} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="email">Email Address</label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="company">Company</label>
                  <Input 
                    id="company" 
                    name="company" 
                    value={profileData.company} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="position">Position</label>
                  <Input 
                    id="position" 
                    name="position" 
                    value={profileData.position} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1" htmlFor="phone">Phone Number</label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={profileData.phone} 
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-md font-medium mb-4">Notification Preferences</h3>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive email notifications</p>
                  </div>
                  <Switch 
                    checked={preferences.emailNotifications} 
                    onCheckedChange={() => handleSwitchChange('emailNotifications')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch 
                    checked={preferences.pushNotifications} 
                    onCheckedChange={() => handleSwitchChange('pushNotifications')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">New Matches</h4>
                    <p className="text-sm text-muted-foreground">Get notified about new startup matches</p>
                  </div>
                  <Switch 
                    checked={preferences.newMatches} 
                    onCheckedChange={() => handleSwitchChange('newMatches')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Market Updates</h4>
                    <p className="text-sm text-muted-foreground">Receive market and industry updates</p>
                  </div>
                  <Switch 
                    checked={preferences.marketUpdates} 
                    onCheckedChange={() => handleSwitchChange('marketUpdates')} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Weekly Digest</h4>
                    <p className="text-sm text-muted-foreground">Get a weekly summary of activities</p>
                  </div>
                  <Switch 
                    checked={preferences.weeklyDigest} 
                    onCheckedChange={() => handleSwitchChange('weeklyDigest')} 
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button type="submit">Save Preferences</Button>
              </div>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="investment">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-md font-medium mb-4">Investment Criteria</h3>
            <form onSubmit={handleSaveInvestmentPreferences} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Button type="submit">Save Preferences</Button>
              </div>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-md font-medium mb-4">Security Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Change Password</h4>
                <form className="space-y-4">
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
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Two-factor authentication",
                      description: "Setup process initiated",
                    });
                  }}
                >
                  Enable 2FA
                </Button>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Active Sessions</h4>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">This Device - Chrome on macOS</p>
                        <p className="text-xs text-muted-foreground">Last active: Just now</p>
                      </div>
                      <div className="text-sm text-accent">Current</div>
                    </div>
                  </div>
                  <div className="p-3 border border-border rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">iPhone 14 - Safari</p>
                        <p className="text-xs text-muted-foreground">Last active: Yesterday</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs h-8"
                        onClick={() => {
                          toast({
                            title: "Session terminated",
                            description: "The device has been logged out",
                          });
                        }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
