
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Edit, Upload, Trash, Check } from "lucide-react";

export const ProfileTab = () => {
  const [editing, setEditing] = useState(false);
  const [startup, setStartup] = useState({
    name: "TechNova",
    tagline: "AI-Powered Healthcare Diagnostics for All",
    website: "https://technova.ai",
    location: "San Francisco, CA",
    founded: "2021",
    employees: "12",
    stage: "Series A",
    industry: "Healthcare, Artificial Intelligence",
    bio: "TechNova is revolutionizing healthcare with AI-driven diagnostic tools focused on underserved markets. Our technology helps clinicians make faster, more accurate diagnoses at a fraction of the cost of traditional methods.",
    fundraising: {
      target: "$2,000,000",
      raised: "$500,000",
      minInvestment: "$50,000",
      equity: "8%"
    },
    team: [
      { name: "Alex Johnson", role: "CEO & Co-Founder", bio: "Ex-Google, Stanford MBA" },
      { name: "Sam Rodriguez", role: "CTO & Co-Founder", bio: "MIT AI Lab, 3 previous startups" },
      { name: "Jamie Chen", role: "Chief Medical Officer", bio: "Johns Hopkins MD, 15 years in diagnostics" }
    ],
    metrics: {
      users: "5,200",
      mrr: "$18,500",
      growth: "22%",
      partnerships: "3"
    }
  });

  const handleEditToggle = () => {
    if (editing) {
      // Save changes
      toast({
        title: "Profile updated",
        description: "Your company profile has been saved",
      });
    }
    setEditing(!editing);
  };

  const handleInputChange = (field: string, value: string) => {
    setStartup(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetricChange = (field: string, value: string) => {
    setStartup(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: value
      }
    }));
  };

  const handleFundraisingChange = (field: string, value: string) => {
    setStartup(prev => ({
      ...prev,
      fundraising: {
        ...prev.fundraising,
        [field]: value
      }
    }));
  };

  const handleAvatarUpload = () => {
    toast({
      title: "Upload company logo",
      description: "Logo upload functionality coming soon",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with avatar and edit button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarFallback className="text-2xl font-bold bg-accent/10 text-accent">
                TN
              </AvatarFallback>
            </Avatar>
            {editing && (
              <button 
                className="absolute bottom-0 right-0 bg-accent text-white p-1 rounded-full"
                onClick={handleAvatarUpload}
              >
                <Upload size={14} />
              </button>
            )}
          </div>
          <div>
            {editing ? (
              <Input 
                value={startup.name} 
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-xl font-bold mb-1 h-9"
              />
            ) : (
              <h1 className="text-2xl font-bold">{startup.name}</h1>
            )}
            {editing ? (
              <Input 
                value={startup.tagline} 
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="text-sm text-muted-foreground h-7"
              />
            ) : (
              <p className="text-muted-foreground">{startup.tagline}</p>
            )}
          </div>
        </div>
        <Button 
          variant={editing ? "accent" : "outline"} 
          size="sm" 
          className="mt-4 md:mt-0"
          onClick={handleEditToggle}
        >
          {editing ? (
            <>
              <Check size={16} />
              <span>Save Profile</span>
            </>
          ) : (
            <>
              <Edit size={16} />
              <span>Edit Profile</span>
            </>
          )}
        </Button>
      </div>

      {/* Company Info */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Website</label>
            {editing ? (
              <Input 
                value={startup.website} 
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.website}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Location</label>
            {editing ? (
              <Input 
                value={startup.location} 
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.location}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Founded</label>
            {editing ? (
              <Input 
                value={startup.founded} 
                onChange={(e) => handleInputChange('founded', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.founded}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Employees</label>
            {editing ? (
              <Input 
                value={startup.employees} 
                onChange={(e) => handleInputChange('employees', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.employees}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Funding Stage</label>
            {editing ? (
              <Input 
                value={startup.stage} 
                onChange={(e) => handleInputChange('stage', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.stage}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Industry</label>
            {editing ? (
              <Input 
                value={startup.industry} 
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.industry}</p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <label className="text-sm font-medium text-muted-foreground">Company Bio</label>
          {editing ? (
            <textarea 
              value={startup.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="mt-1 w-full p-2 min-h-24 rounded-md border border-input bg-transparent"
            />
          ) : (
            <p className="mt-1">{startup.bio}</p>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <h3 className="text-sm font-medium text-muted-foreground">Users</h3>
            {editing ? (
              <Input 
                value={startup.metrics.users}
                onChange={(e) => handleMetricChange('users', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{startup.metrics.users}</p>
            )}
          </div>
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
            {editing ? (
              <Input 
                value={startup.metrics.mrr}
                onChange={(e) => handleMetricChange('mrr', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{startup.metrics.mrr}</p>
            )}
          </div>
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <h3 className="text-sm font-medium text-muted-foreground">Monthly Growth</h3>
            {editing ? (
              <Input 
                value={startup.metrics.growth}
                onChange={(e) => handleMetricChange('growth', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{startup.metrics.growth}</p>
            )}
          </div>
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <h3 className="text-sm font-medium text-muted-foreground">Partnerships</h3>
            {editing ? (
              <Input 
                value={startup.metrics.partnerships}
                onChange={(e) => handleMetricChange('partnerships', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{startup.metrics.partnerships}</p>
            )}
          </div>
        </div>
      </div>

      {/* Fundraising */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Current Fundraising</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Target Amount</label>
            {editing ? (
              <Input 
                value={startup.fundraising.target}
                onChange={(e) => handleFundraisingChange('target', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.fundraising.target}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Raised So Far</label>
            {editing ? (
              <Input 
                value={startup.fundraising.raised}
                onChange={(e) => handleFundraisingChange('raised', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.fundraising.raised}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Minimum Investment</label>
            {editing ? (
              <Input 
                value={startup.fundraising.minInvestment}
                onChange={(e) => handleFundraisingChange('minInvestment', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.fundraising.minInvestment}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Equity Offered</label>
            {editing ? (
              <Input 
                value={startup.fundraising.equity}
                onChange={(e) => handleFundraisingChange('equity', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1">{startup.fundraising.equity}</p>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1">
            <span>{startup.fundraising.raised} raised</span>
            <span>{startup.fundraising.target} goal</span>
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-2.5">
            <div className="bg-accent h-2.5 rounded-full" style={{ width: "25%" }}></div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Team</h2>
        <div className="space-y-4">
          {startup.team.map((member, index) => (
            <div key={index} className="p-4 border border-border rounded-md bg-background/40">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground mt-1">{member.bio}</p>
                  </div>
                </div>
                {editing && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      toast({
                        title: "Remove team member",
                        description: `${member.name} would be removed from the team`,
                      });
                    }}
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {editing && (
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => {
                toast({
                  title: "Add team member",
                  description: "Team member addition functionality coming soon",
                });
              }}
            >
              + Add Team Member
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
