
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MinimalFooter } from "@/components/layout/MinimalFooter";
import { BarChart3, Users, Settings, Building, Rss, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Import tab components
import { FeedTab } from "@/components/shared/FeedTab";
import { FindInvestorsTab } from "@/components/startup/FindInvestorsTab";
import { FindCompaniesTab } from "@/components/startup/FindCompaniesTab";
import { SettingsTab } from "@/components/startup/SettingsTab";
import { VerificationOnboarding } from "@/components/startup/VerificationOnboarding";

const StartupDashboard = () => {
  const [activeTab, setActiveTab] = useState("feed");
  const [startupName, setStartupName] = useState("");
  const [profileComplete, setProfileComplete] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");
  const [savingBasicProfile, setSavingBasicProfile] = useState(false);
  const [hasRequiredFields, setHasRequiredFields] = useState(false);
  const [lookingForFunding, setLookingForFunding] = useState(false);
  const [lookingForDesignPartner, setLookingForDesignPartner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchStartupData();
      checkProfileCompletion();
      
      // Set the active tab if specified in URL
      const tabParam = searchParams.get("tab");
      if (tabParam && ["feed", "investors", "companies", "settings"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [user, searchParams]);

  const fetchStartupData = async () => {
    try {
      console.log("Fetching startup data for user:", user.id);
      
      // First check if we have a startup_profile
      const { data: startupProfile, error: startupError } = await supabase
        .from('startup_profiles')
        .select('name, industry, looking_for_funding, looking_for_design_partner')
        .eq('id', user.id)
        .maybeSingle();
      
      if (startupError) {
        console.error("Error fetching startup profile:", startupError);
        throw startupError;
      }
      
      if (startupProfile?.name) {
        console.log("Found startup profile:", startupProfile);
        setStartupName(startupProfile.name);
        setHasRequiredFields(!!startupProfile.industry);
        setLookingForFunding(startupProfile.looking_for_funding || false);
        setLookingForDesignPartner(startupProfile.looking_for_design_partner || false);
        
        // Don't show dialog if we already have a profile with industry
        if (!!startupProfile.industry) {
          setShowProfileDialog(false);
        }
      } else {
        console.log("No startup profile found, checking user profile");
        // Fallback to the regular profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, verified')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          throw profileError;
        }
        
        if (profile?.name) {
          console.log("Found user profile with name:", profile.name);
          setStartupName(profile.name);
          // Show dialog to set industry if we don't have a startup profile
          setShowProfileDialog(true);
          
          // Check if user is verified
          setIsUserVerified(!!profile.verified);
        } else {
          console.log("No profile found at all. New user");
          // No profile name found - new user, show the dialog
          setShowProfileDialog(true);
        }
      }
    } catch (error) {
      console.error("Error fetching startup data:", error);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      // Check if we have at least a startup profile with required fields
      const { data: startupProfile, error } = await supabase
        .from('startup_profiles')
        .select('name, industry, bio')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Required fields must be filled
      const requiredFieldsFilled = !!(startupProfile?.name && startupProfile?.industry);
      setHasRequiredFields(requiredFieldsFilled);
      
      // Consider profile complete if we have more than just the required fields
      // Check specifically for bio field
      setProfileComplete(!!startupProfile && requiredFieldsFilled && !!startupProfile.bio);
      
      // Check if user is verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('verified')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        setIsUserVerified(!!profile.verified);
        
        // Show verification dialog if they have a completed profile but aren't verified yet
        if (requiredFieldsFilled && !profile.verified) {
          // Only show after a slight delay so it doesn't appear immediately on login
          setTimeout(() => {
            setShowVerificationDialog(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error checking profile completion:", error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleCompleteProfileClick = () => {
    navigate('/business/profile');
  };
  
  const saveBasicProfile = async () => {
    if (!newCompanyName || !newIndustry) {
      toast({
        title: "Required fields",
        description: "Company name and industry are required",
        variant: "destructive"
      });
      return;
    }

    try {
      setSavingBasicProfile(true);
      console.log("Saving basic profile with name:", newCompanyName, "and industry:", newIndustry);

      // Update the profile record
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ name: newCompanyName })
        .eq('id', user.id);
        
      if (profileUpdateError) {
        console.error("Error updating profile name:", profileUpdateError);
        throw profileUpdateError;
      }

      // Check if startup profile exists
      const { data: existingProfile } = await supabase
        .from('startup_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log("Updating existing startup profile");
        // Update existing startup profile
        const { error: updateError } = await supabase
          .from('startup_profiles')
          .update({ 
            name: newCompanyName,
            industry: newIndustry,
            looking_for_funding: lookingForFunding,
            looking_for_design_partner: lookingForDesignPartner,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error("Error updating startup profile:", updateError);
          throw updateError;
        }
      } else {
        console.log("Creating new startup profile");
        // Insert new startup profile
        const { error: insertError } = await supabase
          .from('startup_profiles')
          .insert({
            id: user.id,
            name: newCompanyName,
            industry: newIndustry,
            looking_for_funding: lookingForFunding,
            looking_for_design_partner: lookingForDesignPartner
          });
          
        if (insertError) {
          console.error("Error creating startup profile:", insertError);
          throw insertError;
        }
      }

      // Update task completion status
      const { data: companyTask } = await supabase
        .from('profile_completion_tasks')
        .select('id')
        .eq('startup_id', user.id)
        .eq('task_name', 'Add company details')
        .maybeSingle();

      if (companyTask) {
        await supabase
          .from('profile_completion_tasks')
          .update({ 
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', companyTask.id);
      } else {
        // Create the task as completed
        await supabase
          .from('profile_completion_tasks')
          .insert({
            startup_id: user.id,
            task_name: 'Add company details',
            completed: true,
            completed_at: new Date().toISOString()
          });
      }

      setStartupName(newCompanyName);
      setHasRequiredFields(true);
      setShowProfileDialog(false);
      
      // Show verification dialog after profile setup
      setTimeout(() => {
        setShowVerificationDialog(true);
      }, 500);

      toast({
        title: "Profile updated",
        description: "Your basic profile has been saved"
      });

      // Refresh data
      fetchStartupData();
      checkProfileCompletion();
    } catch (error) {
      console.error("Error saving basic profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your profile",
        variant: "destructive"
      });
    } finally {
      setSavingBasicProfile(false);
    }
  };

  const handlePartnershipToggle = async (type: 'funding' | 'design', value: boolean) => {
    try {
      const updateData = type === 'funding' 
        ? { looking_for_funding: value }
        : { looking_for_design_partner: value };
      
      // Update local state
      if (type === 'funding') {
        setLookingForFunding(value);
      } else {
        setLookingForDesignPartner(value);
      }
      
      // Update in database
      const { error } = await supabase
        .from('startup_profiles')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) {
        console.error(`Error updating ${type} status:`, error);
        toast({
          title: "Error",
          description: `Failed to update ${type} status`,
          variant: "destructive"
        });
        // Revert local state if update failed
        if (type === 'funding') {
          setLookingForFunding(!value);
        } else {
          setLookingForDesignPartner(!value);
        }
      } else {
        toast({
          title: "Status updated",
          description: `Your ${type === 'funding' ? 'funding' : 'design partnership'} status has been updated`
        });
      }
    } catch (error) {
      console.error(`Error in handlePartnershipToggle (${type}):`, error);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: "Search query empty",
        description: "Please enter a search term",
      });
      return;
    }
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to use the search feature",
      });
      return;
    }
    
    try {
      setSearching(true);
      
      console.log("Searching for companies with query:", searchQuery);
      
      // In the future, implement company search functionality here
      
      toast({
        title: "Search feature",
        description: "Company search will be implemented in a future update",
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message || "Failed to process your search query",
      });
    } finally {
      setSearching(false);
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "feed":
        return <FeedTab />;
      case "investors":
        return <FindInvestorsTab />;
      case "companies":
        return <FindCompaniesTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <FeedTab />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Business Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {startupName || "Founder"}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="looking-for-funding"
                    checked={lookingForFunding}
                    onCheckedChange={(checked) => handlePartnershipToggle('funding', checked)}
                  />
                  <Label htmlFor="looking-for-funding" className="text-xs whitespace-nowrap">
                    Seeking funding
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    id="looking-for-design-partner"
                    checked={lookingForDesignPartner}
                    onCheckedChange={(checked) => handlePartnershipToggle('design', checked)}
                  />
                  <Label htmlFor="looking-for-design-partner" className="text-xs whitespace-nowrap">
                    Design partner
                  </Label>
                </div>
              </div>
              
              {(!profileComplete && hasRequiredFields) && (
                <button 
                  className="flex items-center space-x-2 py-2 px-4 rounded-md bg-secondary text-secondary-foreground text-sm"
                  onClick={handleCompleteProfileClick}
                >
                  <span>Complete Your Profile</span>
                </button>
              )}
              
              {!isUserVerified && hasRequiredFields && (
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={() => setShowVerificationDialog(true)}
                >
                  Get Verified
                </Button>
              )}
            </div>
          </div>
          
          <div className="md:hidden flex justify-end mb-4">
            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1.5">
                <Switch 
                  id="m-looking-for-funding"
                  checked={lookingForFunding}
                  onCheckedChange={(checked) => handlePartnershipToggle('funding', checked)}
                />
                <Label htmlFor="m-looking-for-funding" className="text-xs">
                  Seeking funding
                </Label>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Switch 
                  id="m-looking-for-design-partner"
                  checked={lookingForDesignPartner}
                  onCheckedChange={(checked) => handlePartnershipToggle('design', checked)}
                />
                <Label htmlFor="m-looking-for-design-partner" className="text-xs">
                  Design partner
                </Label>
              </div>
            </div>
          </div>
          
          {/* Company Search - Only visible on companies tab */}
          {activeTab === "companies" && (
            <div className="glass-card rounded-lg p-4 mb-8 animate-fade-in">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search companies using natural language, e.g. 'Design agencies in Europe' or 'SaaS companies for healthcare'"
                  className="w-full h-12 pl-11 pr-4 rounded-md bg-background/70 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={searching}
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-2 bg-accent text-accent-foreground px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 disabled:opacity-70"
                  disabled={searching || !searchQuery.trim()}
                >
                  {searching ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </form>
            </div>
          )}
          
          <div className="border-b border-border/60 mb-8">
            <div className="flex overflow-x-auto pb-1">
              {[
                { id: "feed", label: "Feed", icon: <Rss size={16} /> },
                { id: "investors", label: "Find Investors", icon: <Users size={16} /> },
                { id: "companies", label: "Find Companies", icon: <Building size={16} /> },
                { id: "settings", label: "Settings", icon: <Settings size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {renderTabContent()}
        </div>
      </main>
      <MinimalFooter />

      {/* Initial profile setup dialog - only shown once for new users */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Welcome to Flubo!</DialogTitle>
            <DialogDescription>
              Let's get started with some basic information about your business.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Please provide some basic details about your company to get started:</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Your company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry <span className="text-red-500">*</span>
                </label>
                <Input
                  id="industry"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="e.g. FinTech, Healthcare, AI"
                  required
                />
              </div>
              
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium">Partnership Status</h4>
                
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="dialog-looking-for-funding"
                      checked={lookingForFunding}
                      onCheckedChange={setLookingForFunding}
                    />
                    <label htmlFor="dialog-looking-for-funding" className="text-sm">
                      Looking for funding
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="dialog-looking-for-design-partner"
                      checked={lookingForDesignPartner}
                      onCheckedChange={setLookingForDesignPartner}
                    />
                    <label htmlFor="dialog-looking-for-design-partner" className="text-sm">
                      Looking for design partnerships
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              * Required fields. You can complete the rest of your profile later.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowProfileDialog(false)}
              disabled={savingBasicProfile}
            >
              Finish Later
            </Button>
            <Button 
              onClick={saveBasicProfile}
              disabled={!newCompanyName || !newIndustry || savingBasicProfile}
            >
              {savingBasicProfile ? "Saving..." : "Save & Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Verification Dialog */}
      <VerificationOnboarding
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        userType="startup"
      />
    </div>
  );
};

export default StartupDashboard;
