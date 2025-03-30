import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { Edit, Upload, Check, BriefcaseBusiness, Building, Globe, DollarSign, User, Users, Link } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useFollowUser } from "@/hooks/useFollowUser";
import { useParams } from "react-router-dom";

interface ProfileTabProps {
  onShowFollowers?: () => void;
  onShowFollowing?: () => void;
}

export const ProfileTab = ({ onShowFollowers, onShowFollowing }: ProfileTabProps) => {
  const { user } = useAuth();
  const { id: profileId } = useParams();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [postCount, setPostCount] = useState<number>(0);
  const { 
    followersCount, 
    followingCount, 
    loadFollowData 
  } = useFollowUser();
  
  const [investor, setInvestor] = useState({
    name: "",
    title: "",
    firm: "",
    location: "",
    website: "",
    bio: "",
    investmentCriteria: {
      stages: ["Seed", "Series A"],
      checkSize: "$250K - $2M",
      sectors: ["Healthcare", "Fintech", "Enterprise Software", "AI/ML"],
      regions: ["North America", "Europe", "Southeast Asia"]
    },
    portfolio: {
      activeInvestments: "14",
      exited: "6",
      totalDeployed: "$28M"
    },
    preferences: {
      foundersBackgroundPreference: "Technical founders with domain expertise. Value previous startup experience.",
      businessModelPreference: "B2B SaaS with recurring revenue. Looking for capital-efficient businesses with clear paths to profitability.",
      contactPreference: "Prefer warm introductions, but open to cold outreach with a clear and concise pitch."
    }
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('investor_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (preferencesError) throw preferencesError;
        
        setInvestor(prev => ({
          ...prev,
          name: profileData?.name || "Unnamed Investor",
          title: profileData?.position || prev.title,
          firm: profileData?.company || prev.firm,
          investmentCriteria: {
            ...prev.investmentCriteria,
            stages: preferencesData?.preferred_stages || prev.investmentCriteria.stages,
            sectors: preferencesData?.preferred_sectors || prev.investmentCriteria.sectors,
            checkSize: preferencesData?.min_investment && preferencesData?.max_investment 
              ? `${preferencesData.min_investment} - ${preferencesData.max_investment}`
              : prev.investmentCriteria.checkSize
          }
        }));
        
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "Could not retrieve your investor profile."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (profileId) {
      fetchPostCount();
      loadFollowData(profileId);
    }
  }, [profileId]);

  const fetchPostCount = async () => {
    if (!profileId) return;
    
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);
      
      if (error) {
        console.error("Error fetching post count:", error);
      } else if (count !== null) {
        setPostCount(count);
      }
    } catch (error) {
      console.error("Error in fetchPostCount:", error);
    }
  };

  const handleEditToggle = async () => {
    if (editing) {
      try {
        if (!user) return;
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: investor.name,
            position: investor.title,
            company: investor.firm
          })
          .eq('id', user.id);
          
        if (profileError) throw profileError;
        
        let minInvestment = null;
        let maxInvestment = null;
        
        if (investor.investmentCriteria.checkSize) {
          const parts = investor.investmentCriteria.checkSize.split('-').map(p => p.trim());
          if (parts.length === 2) {
            minInvestment = parts[0];
            maxInvestment = parts[1];
          } else if (parts.length === 1) {
            minInvestment = parts[0];
          }
        }
        
        const { error: preferencesError } = await supabase
          .from('investor_preferences')
          .upsert({
            user_id: user.id,
            preferred_stages: investor.investmentCriteria.stages,
            preferred_sectors: investor.investmentCriteria.sectors,
            min_investment: minInvestment,
            max_investment: maxInvestment
          }, { onConflict: 'user_id' });
          
        if (preferencesError) throw preferencesError;
        
        toast({
          title: "Profile updated",
          description: "Your investor profile has been saved",
        });
      } catch (error) {
        console.error("Error saving profile data:", error);
        toast({
          variant: "destructive",
          title: "Failed to save profile",
          description: "Could not update your investor profile."
        });
      }
    }
    setEditing(!editing);
  };

  const handleInputChange = (field: string, value: string) => {
    setInvestor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePortfolioChange = (field: string, value: string) => {
    setInvestor(prev => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        [field]: value
      }
    }));
  };

  const handlePreferenceChange = (field: string, value: string) => {
    setInvestor(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleAvatarUpload = () => {
    toast({
      title: "Upload profile photo",
      description: "Profile photo upload functionality coming soon",
    });
  };

  const handleCriteriaChange = (field: string, value: string) => {
    if (field === "stages" || field === "sectors" || field === "regions") {
      const valueArray = value.split(',').map(item => item.trim());
      setInvestor(prev => ({
        ...prev,
        investmentCriteria: {
          ...prev.investmentCriteria,
          [field]: valueArray
        }
      }));
    } else {
      setInvestor(prev => ({
        ...prev,
        investmentCriteria: {
          ...prev.investmentCriteria,
          [field]: value
        }
      }));
    }
  };

  const followStatsSection = (
    <div className="flex items-center space-x-6 mt-2">
      <button 
        onClick={onShowFollowers}
        className="flex items-center space-x-1 hover:text-accent transition-colors"
      >
        <Users size={14} className="text-muted-foreground" />
        <span className="text-sm"><strong>{followersCount}</strong> followers</span>
      </button>
      <button 
        onClick={onShowFollowing}
        className="flex items-center space-x-1 hover:text-accent transition-colors"
      >
        <User size={14} className="text-muted-foreground" />
        <span className="text-sm"><strong>{followingCount}</strong> following</span>
      </button>
      <div className="flex items-center space-x-1">
        <Link size={14} className="text-muted-foreground" />
        <span className="text-sm"><strong>{postCount}</strong> posts</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent mr-2" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarFallback className="text-2xl font-bold bg-accent/10 text-accent">
                {investor.name ? investor.name.charAt(0) : "?"}
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
                value={investor.name} 
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-xl font-bold mb-1 h-9"
              />
            ) : (
              <h1 className="text-2xl font-bold">{investor.name}</h1>
            )}
            <div className="flex items-center text-muted-foreground">
              {editing ? (
                <Input 
                  value={investor.title} 
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-sm h-7"
                />
              ) : (
                <p>{investor.title}</p>
              )}
              <span className="mx-1">•</span>
              {editing ? (
                <Input 
                  value={investor.firm} 
                  onChange={(e) => handleInputChange('firm', e.target.value)}
                  className="text-sm h-7"
                />
              ) : (
                <p>{investor.firm}</p>
              )}
            </div>
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

      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Investor Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-2">
            <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Firm</label>
              {editing ? (
                <Input 
                  value={investor.firm} 
                  onChange={(e) => handleInputChange('firm', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{investor.firm}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              {editing ? (
                <Input 
                  value={investor.location} 
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{investor.location}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Website</label>
              {editing ? (
                <Input 
                  value={investor.website} 
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{investor.website}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <label className="text-sm font-medium text-muted-foreground">Bio</label>
          {editing ? (
            <textarea 
              value={investor.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="mt-1 w-full p-2 min-h-24 rounded-md border border-input bg-transparent"
            />
          ) : (
            <p className="mt-1">{investor.bio}</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Portfolio Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <div className="flex items-center">
              <BriefcaseBusiness className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-sm font-medium text-muted-foreground">Active Investments</h3>
            </div>
            {editing ? (
              <Input 
                value={investor.portfolio.activeInvestments}
                onChange={(e) => handlePortfolioChange('activeInvestments', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{investor.portfolio.activeInvestments}</p>
            )}
          </div>
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-sm font-medium text-muted-foreground">Exits</h3>
            </div>
            {editing ? (
              <Input 
                value={investor.portfolio.exited}
                onChange={(e) => handlePortfolioChange('exited', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{investor.portfolio.exited}</p>
            )}
          </div>
          <div className="p-4 bg-background/70 rounded-lg border border-border/60">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-accent mr-2" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Deployed</h3>
            </div>
            {editing ? (
              <Input 
                value={investor.portfolio.totalDeployed}
                onChange={(e) => handlePortfolioChange('totalDeployed', e.target.value)}
                className="mt-1 text-xl font-bold"
              />
            ) : (
              <p className="text-xl font-bold mt-1">{investor.portfolio.totalDeployed}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Investment Criteria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Investment Stages</label>
            {editing ? (
              <Input 
                value={investor.investmentCriteria.stages.join(', ')}
                onChange={(e) => handleCriteriaChange('stages', e.target.value)}
                className="mt-1"
                placeholder="e.g. Seed, Series A"
              />
            ) : (
              <p className="mt-1">{investor.investmentCriteria.stages.join(', ')}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Check Size</label>
            {editing ? (
              <Input 
                value={investor.investmentCriteria.checkSize}
                onChange={(e) => handleCriteriaChange('checkSize', e.target.value)}
                className="mt-1"
                placeholder="e.g. $250K - $2M"
              />
            ) : (
              <p className="mt-1">{investor.investmentCriteria.checkSize}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Focus Sectors</label>
            {editing ? (
              <Input 
                value={investor.investmentCriteria.sectors.join(', ')}
                onChange={(e) => handleCriteriaChange('sectors', e.target.value)}
                className="mt-1"
                placeholder="e.g. Healthcare, Fintech"
              />
            ) : (
              <p className="mt-1">{investor.investmentCriteria.sectors.join(', ')}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Geographic Focus</label>
            {editing ? (
              <Input 
                value={investor.investmentCriteria.regions.join(', ')}
                onChange={(e) => handleCriteriaChange('regions', e.target.value)}
                className="mt-1"
                placeholder="e.g. North America, Europe"
              />
            ) : (
              <p className="mt-1">{investor.investmentCriteria.regions.join(', ')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-lg">
        <h2 className="text-lg font-medium mb-4">Investment Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Founder Background</label>
            {editing ? (
              <textarea 
                value={investor.preferences.foundersBackgroundPreference}
                onChange={(e) => handlePreferenceChange('foundersBackgroundPreference', e.target.value)}
                className="mt-1 w-full p-2 min-h-20 rounded-md border border-input bg-transparent"
              />
            ) : (
              <p className="mt-1">{investor.preferences.foundersBackgroundPreference}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Business Model</label>
            {editing ? (
              <textarea 
                value={investor.preferences.businessModelPreference}
                onChange={(e) => handlePreferenceChange('businessModelPreference', e.target.value)}
                className="mt-1 w-full p-2 min-h-20 rounded-md border border-input bg-transparent"
              />
            ) : (
              <p className="mt-1">{investor.preferences.businessModelPreference}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Contact Preference</label>
            {editing ? (
              <textarea 
                value={investor.preferences.contactPreference}
                onChange={(e) => handlePreferenceChange('contactPreference', e.target.value)}
                className="mt-1 w-full p-2 min-h-20 rounded-md border border-input bg-transparent"
              />
            ) : (
              <p className="mt-1">{investor.preferences.contactPreference}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
