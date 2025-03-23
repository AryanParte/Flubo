
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { InvestorSearch } from "./investors/InvestorSearch";
import { InvestorList } from "./investors/InvestorList";
import { useInvestorData } from "@/hooks/use-investor-data";

export const FindInvestorsTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  
  const {
    loading,
    refreshing,
    investors,
    searchQuery,
    activeTab,
    handleRefresh,
    handleTabChange,
    handleSearch,
    clearSearch
  } = useInvestorData(user?.id);
  
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
  
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-lg">
        <InvestorSearch 
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onTabChange={handleTabChange}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          activeTab={activeTab}
        />
        
        <InvestorList 
          investors={investors}
          loading={loading}
          refreshing={refreshing}
          searchQuery={searchQuery}
          sendingMessage={sendingMessage}
          onClearSearch={clearSearch}
          onConnect={handleMessageInvestor}
        />
      </div>
    </div>
  );
};
