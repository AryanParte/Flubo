import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Edit, Upload, Trash, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useParams, useNavigate } from "react-router-dom";

const emptyStartupProfile = {
  name: "",
  tagline: "",
  website: "",
  location: "",
  founded: "",
  employees: "",
  stage: "",
  industry: "",
  bio: "",
  fundraising: {
    target: "",
    raised: "",
    minInvestment: "",
    equity: ""
  },
  team: [],
  metrics: {
    users: "",
    mrr: "",
    growth: "",
    partnerships: ""
  }
};

export const ProfileTab = () => {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  
  const profileId = params.id || (user ? user.id : null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);
  const [startup, setStartup] = useState(emptyStartupProfile);

  useEffect(() => {
    if (profileId) {
      console.log("Fetching profile for ID:", profileId);
      fetchStartupProfile();
    } else {
      console.log("No profile ID available");
      setLoading(false);
      setError("No profile ID available");
    }
  }, [profileId]);

  const fetchStartupProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching startup profile...");
      
      // First check if user exists in profiles table
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      
      if (userProfileError) {
        console.error("Error checking user profile:", userProfileError);
        throw new Error("Could not verify user profile");
      }
      
      if (!userProfile) {
        console.error("User profile not found in profiles table");
        throw new Error("User profile not found. Please complete your account setup first.");
      }
      
      // Check if we have a startup profile
      const { data: startupProfile, error: profileError } = await supabase
        .from('startup_profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      
      console.log("Startup profile query result:", { startupProfile, profileError });
      
      // If we don't have a startup profile yet, we'll create one with default values
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log("No profile found, will create default");
          // Only create default if viewing own profile and we haven't tried already
          if (user && user.id === profileId && !profileCreationAttempted) {
            setProfileCreationAttempted(true);
            try {
              await createBasicStartupProfile(userProfile.name);
              // Fetch the profile again after creating it
              await fetchStartupProfile();
              return;
            } catch (error) {
              console.error("Error creating default profile:", error);
              throw error;
            }
          } else {
            throw new Error("Profile not found");
          }
        } else {
          throw profileError;
        }
      }
      
      // Get the metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('startup_metrics')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      
      console.log("Metrics query result:", { metricsData, metricsError });
      
      if (metricsError && metricsError.code !== 'PGRST116') {
        console.error("Error fetching metrics:", metricsError);
      }
      
      // Get team members
      const { data: teamData, error: teamError } = await supabase
        .from('startup_team_members')
        .select('*')
        .eq('startup_id', profileId);
      
      console.log("Team query result:", { teamData, teamError });
      
      if (teamError) {
        console.error("Error fetching team data:", teamError);
      }
      
      // Build the complete startup object
      setStartup({
        name: startupProfile?.name || "",
        tagline: startupProfile?.tagline || "",
        website: startupProfile?.website || "",
        location: startupProfile?.location || "",
        founded: startupProfile?.founded || "",
        employees: startupProfile?.employees || "",
        stage: startupProfile?.stage || "",
        industry: startupProfile?.industry || "",
        bio: startupProfile?.bio || "",
        fundraising: {
          target: startupProfile?.target_amount || "",
          raised: startupProfile?.raised_amount || "",
          minInvestment: startupProfile?.min_investment || "",
          equity: startupProfile?.equity_offered || ""
        },
        team: teamData || [],
        metrics: {
          users: metricsData?.users || "",
          mrr: metricsData?.mrr || "",
          growth: metricsData?.growth || "",
          partnerships: metricsData?.partnerships || ""
        }
      });
      
      console.log("Profile data loaded successfully");

      // If this is your own profile and it's mostly empty, enable editing by default
      if (user && user.id === profileId && !startupProfile.bio) {
        setEditing(true);
      }
      
    } catch (error) {
      console.error("Error fetching startup profile:", error);
      setError(error instanceof Error ? error.message : "Failed to load startup profile");
      toast({
        title: "Error",
        description: "Failed to load startup profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBasicStartupProfile = async (userName: string) => {
    try {
      // Create a minimal startup profile with empty fields
      const defaultName = userName || "Your Startup";
      
      const { error: profileError } = await supabase
        .from('startup_profiles')
        .insert({
          id: user.id,
          name: defaultName,
          industry: "Technology", // Default industry that user should update
        });
      
      if (profileError) throw profileError;
      
      // Create empty metrics record
      const { error: metricsError } = await supabase
        .from('startup_metrics')
        .insert({
          id: user.id,
        });
      
      if (metricsError) throw metricsError;
      
      // Create default completion tasks if they don't exist yet
      const { data: tasks } = await supabase
        .from('profile_completion_tasks')
        .select('*')
        .eq('startup_id', user.id);
      
      if (!tasks || tasks.length === 0) {
        const defaultTasks = [
          { task_name: "Add company details", completed: false },
          { task_name: "Upload pitch deck", completed: false },
          { task_name: "Connect team members", completed: false },
          { task_name: "Add product information", completed: false },
          { task_name: "Set funding requirements", completed: false }
        ];
        
        for (const task of defaultTasks) {
          await supabase
            .from('profile_completion_tasks')
            .insert({
              startup_id: user.id,
              task_name: task.task_name,
              completed: task.completed
            });
        }
      }
      
      console.log("Basic profile created successfully");
      return true;
    } catch (error) {
      console.error("Error creating basic profile:", error);
      throw error;
    }
  };

  const handleEditToggle = async () => {
    if (editing) {
      // Save changes
      try {
        setSaving(true);
        
        // Update startup_profiles table
        const { error: profileError } = await supabase
          .from('startup_profiles')
          .update({
            name: startup.name,
            tagline: startup.tagline,
            website: startup.website,
            location: startup.location,
            founded: startup.founded,
            employees: startup.employees,
            stage: startup.stage,
            industry: startup.industry,
            bio: startup.bio,
            target_amount: startup.fundraising.target,
            raised_amount: startup.fundraising.raised,
            min_investment: startup.fundraising.minInvestment,
            equity_offered: startup.fundraising.equity,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (profileError) throw profileError;
        
        // Update metrics
        const { error: metricsError } = await supabase
          .from('startup_metrics')
          .update({
            users: startup.metrics.users,
            mrr: startup.metrics.mrr,
            growth: startup.metrics.growth,
            partnerships: startup.metrics.partnerships,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (metricsError) throw metricsError;
        
        // Update company details task to completed if not already
        const { data: companyDetailsTask } = await supabase
          .from('profile_completion_tasks')
          .select('*')
          .eq('startup_id', user.id)
          .eq('task_name', 'Add company details')
          .single();
        
        if (companyDetailsTask && !companyDetailsTask.completed) {
          await supabase
            .from('profile_completion_tasks')
            .update({ 
              completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', companyDetailsTask.id);
        }
        
        // Update funding task to completed if not already
        const { data: fundingTask } = await supabase
          .from('profile_completion_tasks')
          .select('*')
          .eq('startup_id', user.id)
          .eq('task_name', 'Set funding requirements')
          .single();
        
        if (fundingTask && !fundingTask.completed) {
          await supabase
            .from('profile_completion_tasks')
            .update({ 
              completed: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', fundingTask.id);
        }
        
        toast({
          title: "Profile updated",
          description: "Your company profile has been saved",
        });
      } catch (error) {
        console.error("Error saving profile:", error);
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
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

  const handleDeleteTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('startup_team_members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setStartup(prev => ({
        ...prev,
        team: prev.team.filter(member => member.id !== id)
      }));
      
      toast({
        title: "Team member removed",
        description: "The team member has been removed from your startup",
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive"
      });
    }
  };

  const handleAddTeamMember = async () => {
    toast({
      title: "Add team member",
      description: "Team member addition functionality coming soon",
    });
    
    // For now, let's add a placeholder team member
    try {
      const newMember = {
        name: "New Team Member",
        role: "Product Manager",
        bio: "Experience at top tech companies"
      };
      
      const { data, error } = await supabase
        .from('startup_team_members')
        .insert({
          startup_id: user.id,
          name: newMember.name,
          role: newMember.role,
          bio: newMember.bio
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setStartup(prev => ({
        ...prev,
        team: [...prev.team, data]
      }));
      
      // Update team members task to completed
      const { data: teamTask } = await supabase
        .from('profile_completion_tasks')
        .select('*')
        .eq('startup_id', user.id)
        .eq('task_name', 'Connect team members')
        .single();
      
      if (teamTask && !teamTask.completed) {
        await supabase
          .from('profile_completion_tasks')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', teamTask.id);
      }
      
    } catch (error) {
      console.error("Error adding team member:", error);
    }
  };

  const isOwnProfile = user && user.id === profileId;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">Error Loading Profile</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="flex justify-center gap-4">
          {isOwnProfile && (
            <Button onClick={fetchStartupProfile}>Try Again</Button>
          )}
          <Button variant="outline" onClick={() => navigate("/startup")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with avatar and edit button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarFallback className="text-2xl font-bold bg-accent/10 text-accent">
                {startup.name ? startup.name.charAt(0) : "?"}
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
        {isOwnProfile && (
          <Button 
            variant={editing ? "accent" : "outline"} 
            size="sm" 
            className="mt-4 md:mt-0"
            onClick={handleEditToggle}
            disabled={saving}
          >
            {editing ? (
              saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} className="mr-2" />
                  <span>Save Profile</span>
                </>
              )
            ) : (
              <>
                <Edit size={16} className="mr-2" />
                <span>Edit Profile</span>
              </>
            )}
          </Button>
        )}
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
            <div 
              className="bg-accent h-2.5 rounded-full" 
              style={{ 
                width: (() => {
                  // Parse the values and calculate percentage
                  try {
                    const raised = parseFloat(startup.fundraising.raised.replace(/[^0-9.]/g, ''));
                    const target = parseFloat(startup.fundraising.target.replace(/[^0-9.]/g, ''));
                    if (!isNaN(raised) && !isNaN(target) && target > 0) {
                      return `${Math.min(100, (raised / target) * 100)}%`;
                    }
                    return "25%"; // Default fallback
                  } catch (e) {
                    return "25%"; // Default fallback
                  }
                })()
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Team</h2>
        <div className="space-y-4">
          {startup.team.map((member) => (
            <div key={member.id} className="p-4 border border-border rounded-md bg-background/40">
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
                    onClick={() => handleDeleteTeamMember(member.id)}
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
              onClick={handleAddTeamMember}
            >
              + Add Team Member
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
