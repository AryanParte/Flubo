
import { useState, useEffect } from "react";
import { Search, Mail, Briefcase, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

type Investor = {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  industry?: string;
  location?: string;
  role?: string;
  company?: string;
};

export const FindInvestorsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [filteredInvestors, setFilteredInvestors] = useState<Investor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchInvestors();
    }
  }, [user]);
  
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      console.log("Fetching investors for startup user:", user.id);
      
      // Fetch all profiles with user_type = 'investor'
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, company, position, user_type')
        .eq('user_type', 'investor');
      
      if (error) throw error;
      
      console.log("Found investors:", data?.length || 0);
      
      // Transform the data to include investor details
      const enhancedInvestors = data?.map(investor => ({
        id: investor.id,
        name: investor.name || 'Unknown Investor',
        email: investor.email,
        // Use actual investor profile data when available
        role: investor.position || 'Angel Investor',
        company: investor.company || 'Tech Ventures',
        // For fields that aren't in the basic profile, we'll still use placeholders
        // In a production app, you'd create and query an investor_profiles table
        bio: "Angel investor with a focus on early-stage startups in technology and innovation.",
        industry: "Technology",
        location: "San Francisco, CA",
      })) || [];
      
      setInvestors(enhancedInvestors);
      setFilteredInvestors(enhancedInvestors);
    } catch (error) {
      console.error("Error fetching investors:", error);
      toast({
        title: "Error",
        description: "Failed to load investors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Filter investors based on search query
    if (searchQuery.trim() === "") {
      setFilteredInvestors(investors);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = investors.filter(investor => 
        investor.name?.toLowerCase().includes(lowercaseQuery) ||
        investor.industry?.toLowerCase().includes(lowercaseQuery) ||
        investor.location?.toLowerCase().includes(lowercaseQuery) ||
        investor.company?.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredInvestors(filtered);
    }
  }, [searchQuery, investors]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Here you could implement filtering by investor type if needed
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleMessageInvestor = async (investorId: string, investorName: string) => {
    try {
      setSendingMessage(investorId);
      
      // Check if there's already a conversation with this investor
      const { data: existingMessages, error: messageError } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${investorId}),and(sender_id.eq.${investorId},recipient_id.eq.${user.id})`)
        .limit(1);
        
      if (messageError) throw messageError;
      
      // If there's no existing conversation, create an initial message
      if (!existingMessages || existingMessages.length === 0) {
        // Get the authenticated user's name from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        const userName = profileData?.name || "Unknown Startup";
        
        // Create initial message from startup to investor
        const { error } = await supabase
          .from('messages')
          .insert({
            content: `Hello from ${userName}! We're interested in connecting with you.`,
            sender_id: user.id,
            recipient_id: investorId,
            sent_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      toast({
        title: "Investor contacted",
        description: `You can now message ${investorName} directly.`,
      });
      
      // Navigate to messages page
      navigate('/startup/messages');
    } catch (error) {
      console.error("Error messaging investor:", error);
      toast({
        title: "Error",
        description: "Failed to contact investor",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-2">Loading investors...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-lg font-medium">Find Investors</h2>
          
          <div className="mt-4 md:mt-0 w-full md:w-72 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search investors"
              className="pl-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all" onClick={() => handleTabChange('all')}>All Investors</TabsTrigger>
            <TabsTrigger value="angel" onClick={() => handleTabChange('angel')}>Angel Investors</TabsTrigger>
            <TabsTrigger value="vc" onClick={() => handleTabChange('vc')}>Venture Capital</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredInvestors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInvestors.map((investor) => (
              <div 
                key={investor.id} 
                className="p-4 border border-border/60 rounded-lg bg-background/40 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12 rounded-full">
                    <AvatarFallback className="bg-accent/10 text-accent">
                      {investor.name?.charAt(0) || 'I'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium text-base">{investor.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Briefcase size={12} className="mr-1" />
                      {investor.role} at {investor.company}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Building size={12} className="mr-1" />
                      {investor.industry}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {investor.location}
                    </p>
                    <p className="text-sm mt-3 line-clamp-2">{investor.bio}</p>
                    
                    <Button
                      variant="accent"
                      size="sm"
                      className="w-full mt-4 flex items-center justify-center"
                      onClick={() => handleMessageInvestor(investor.id, investor.name)}
                      disabled={sendingMessage === investor.id}
                    >
                      {sendingMessage === investor.id ? (
                        <>
                          <Loader2 size={14} className="mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Mail size={14} className="mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background/30 rounded-lg border border-border/60">
            <Search size={48} className="mx-auto text-muted-foreground/60" />
            <h3 className="mt-4 text-lg font-medium">No investors found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : "There are no investors available at the moment."}
            </p>
            {searchQuery && (
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
