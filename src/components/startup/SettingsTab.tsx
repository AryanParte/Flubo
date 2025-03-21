
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SettingsTab = () => {
  const [companyName, setCompanyName] = useState("TechNova");
  const [website, setWebsite] = useState("https://technova.ai");
  const [industry, setIndustry] = useState("Artificial Intelligence");
  const [fundingStage, setFundingStage] = useState("Series A");
  const [bio, setBio] = useState("TechNova is revolutionizing healthcare with AI-driven diagnostic tools for underserved markets.");
  
  const profileForm = useForm();
  const teamForm = useForm();
  const fundingForm = useForm();
  const notificationsForm = useForm();
  
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your company profile has been saved successfully",
    });
  };
  
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Team updated",
      description: "Your team information has been saved successfully",
    });
  };
  
  const handleSaveFunding = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Funding preferences updated",
      description: "Your funding requirements have been saved",
    });
  };
  
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved",
    });
  };

  return (
    <div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Company Information</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">Company Name</label>
                <Input 
                  id="companyName"
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">Website</label>
                <Input 
                  id="website"
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">Industry</label>
                <Input 
                  id="industry"
                  value={industry} 
                  onChange={(e) => setIndustry(e.target.value)} 
                  placeholder="e.g. Fintech, Healthcare, etc."
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="fundingStage" className="text-sm font-medium">Funding Stage</label>
                <Select value={fundingStage} onValueChange={setFundingStage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a funding stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B">Series B</SelectItem>
                    <SelectItem value="Series C">Series C</SelectItem>
                    <SelectItem value="Series D+">Series D+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">Company Bio</label>
                <textarea 
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Brief description of your company"
                />
                <p className="text-sm text-muted-foreground">
                  This will be visible to potential investors
                </p>
              </div>
              
              <Button type="submit" className="mt-2">Save Changes</Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="team">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Team Members</h2>
            
            <form onSubmit={handleSaveTeam} className="space-y-4">
              {[
                { name: "Alex Johnson", position: "CEO & Co-Founder" },
                { name: "Sam Rodriguez", position: "CTO & Co-Founder" },
                { name: "Jamie Chen", position: "Chief Medical Officer" },
              ].map((member, index) => (
                <div key={index} className="p-4 border border-border rounded-md bg-background/40">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-3">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.position}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Edit member",
                          description: `Editing ${member.name}'s information`,
                        });
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="mt-4 w-full" onClick={() => {
                toast({
                  title: "Add team member",
                  description: "Opening form to add a new team member",
                });
              }}>
                + Add Team Member
              </Button>
              
              <Button type="submit" className="mt-2">Save Team</Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="funding">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Funding Requirements</h2>
            
            <form onSubmit={handleSaveFunding} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="amountRaising" className="text-sm font-medium">Amount Raising</label>
                <Input 
                  id="amountRaising"
                  type="text" 
                  defaultValue="$2,000,000" 
                  placeholder="e.g. $1,000,000"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="minInvestment" className="text-sm font-medium">Minimum Investment</label>
                <Input 
                  id="minInvestment"
                  type="text" 
                  defaultValue="$50,000" 
                  placeholder="e.g. $25,000"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="useOfFunds" className="text-sm font-medium">Use of Funds</label>
                <textarea 
                  id="useOfFunds"
                  defaultValue="Product development (40%), Market expansion (30%), Team growth (20%), Operations (10%)"
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Explain how you plan to use the funds"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="previousFunding" className="text-sm font-medium">Previous Funding</label>
                <div className="space-y-2">
                  {[
                    { round: "Seed", amount: "$500,000", date: "Jan 2022", investors: "Angel Investors" },
                  ].map((round, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border border-border rounded-md bg-background/30">
                      <div>
                        <p className="font-medium text-sm">{round.round}</p>
                        <p className="text-xs text-muted-foreground">{round.date} • {round.investors}</p>
                      </div>
                      <p className="font-medium">{round.amount}</p>
                    </div>
                  ))}
                  
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => {
                    toast({
                      title: "Add funding round",
                      description: "Opening form to add previous funding round",
                    });
                  }}>
                    + Add Funding Round
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="mt-2">Save Funding Info</Button>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="glass-card p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
            
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Email Notifications</h3>
                
                {[
                  { id: "new-match", label: "New investor matches", checked: true },
                  { id: "messages", label: "New messages", checked: true },
                  { id: "profile-views", label: "Profile views", checked: false },
                  { id: "funding-updates", label: "Funding updates", checked: true },
                  { id: "newsletters", label: "Platform newsletters", checked: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Push Notifications</h3>
                
                {[
                  { id: "push-matches", label: "New investor matches", checked: true },
                  { id: "push-messages", label: "New messages", checked: true },
                  { id: "push-reminders", label: "Meeting reminders", checked: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <label htmlFor={item.id} className="text-sm">{item.label}</label>
                    <input 
                      id={item.id}
                      type="checkbox"
                      defaultChecked={item.checked}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                  </div>
                ))}
              </div>
              
              <Button type="submit">Save Notification Preferences</Button>
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
                  <Input defaultValue="founder@technova.ai" readOnly className="max-w-sm" />
                  <Button variant="outline" size="sm" onClick={() => {
                    toast({
                      title: "Change email",
                      description: "Opening form to change your email",
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
                    description: "Opening form to change your password",
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
                      <p className="font-medium">Pro Plan</p>
                      <p className="text-sm text-muted-foreground">$49/month</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      toast({
                        title: "Manage subscription",
                        description: "Opening subscription management page",
                      });
                    }}>
                      Manage
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
                      description: "Please confirm if you want to deactivate your account",
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
