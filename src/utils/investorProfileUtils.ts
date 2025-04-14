
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

/**
 * Saves investor preferences to the database
 * Handles both insert and update operations correctly
 */
export const saveInvestorPreferences = async (
  userId: string,
  preferredStages: string[],
  preferredSectors: string[],
  minInvestment: string,
  maxInvestment: string
) => {
  try {
    // First check if there's an existing record
    const { data: existingPrefs, error: checkError } = await supabase
      .from('investor_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingPrefs) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('investor_preferences')
        .update({
          preferred_stages: preferredStages,
          preferred_sectors: preferredSectors,
          min_investment: minInvestment,
          max_investment: maxInvestment,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      if (updateError) throw updateError;
    } else {
      // Insert new preferences
      const { error: insertError } = await supabase
        .from('investor_preferences')
        .insert({
          user_id: userId,
          preferred_stages: preferredStages,
          preferred_sectors: preferredSectors,
          min_investment: minInvestment,
          max_investment: maxInvestment
        });
        
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error saving investor preferences:", error);
    toast({
      title: "Error",
      description: "Failed to save investment preferences",
      variant: "destructive"
    });
    return { success: false, error };
  }
};

/**
 * Gets investor match information from AI chats
 */
export const getInvestorAIMatches = async (investorId: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_persona_chats')
      .select(`
        id,
        startup_id,
        match_score,
        summary,
        completed,
        startup_profiles (
          id, 
          name, 
          industry, 
          stage, 
          location, 
          bio,
          tagline,
          looking_for_funding
        )
      `)
      .eq('investor_id', investorId)
      .eq('completed', true)
      .order('match_score', { ascending: false });
      
    if (error) throw error;
    
    return { data, success: true };
  } catch (error) {
    console.error("Error getting investor AI matches:", error);
    return { data: null, success: false, error };
  }
};

/**
 * Updates the status of an AI match in the feed
 */
export const updateAIMatchStatus = async (
  investorId: string, 
  startupId: string, 
  chatId: string, 
  status: 'new' | 'viewed' | 'followed' | 'pending' | 'accepted' | 'rejected' | 'ignored'
) => {
  try {
    // Check if a status record already exists
    const { data: existingStatus, error: checkError } = await supabase
      .from('ai_match_feed_status')
      .select('id')
      .eq('investor_id', investorId)
      .eq('startup_id', startupId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    if (existingStatus) {
      // Update existing status
      const { error: updateError } = await supabase
        .from('ai_match_feed_status')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', existingStatus.id);
        
      if (updateError) throw updateError;
    } else {
      // Create new status record
      const { error: insertError } = await supabase
        .from('ai_match_feed_status')
        .insert({
          investor_id: investorId,
          startup_id: startupId,
          chat_id: chatId,
          status
        });
        
      if (insertError) throw insertError;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating AI match status:", error);
    return { success: false, error };
  }
};

/**
 * Checks and fixes AI chats that may have been incorrectly marked as completed
 * even though they still have pending questions
 */
export const syncAndFixAIMatchStatus = async (chatId: string) => {
  try {
    // First get the chat details
    const { data: chat, error: chatError } = await supabase
      .from('ai_persona_chats')
      .select('*')
      .eq('id', chatId)
      .single();
      
    if (chatError) throw chatError;
    
    // Get all messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('ai_persona_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (messagesError) throw messagesError;
    
    if (!messages || messages.length === 0) return { success: true };
    
    // Check if the last message is from AI and contains a question
    const lastMessage = messages[messages.length - 1];
    
    // If the last message is from AI and the chat is marked as completed,
    // we should check if it contains a question
    if (
      lastMessage.sender_type === 'ai' &&
      chat.completed === true
    ) {
      const endsWithQuestion = lastMessage.content.trim().endsWith('?');
      
      // If it ends with a question, the chat should not be completed
      if (endsWithQuestion) {
        // Fix the incorrectly marked chat
        const { error: updateError } = await supabase
          .from('ai_persona_chats')
          .update({ completed: false })
          .eq('id', chatId);
          
        if (updateError) throw updateError;
        
        return { 
          success: true, 
          fixed: true, 
          message: "Chat was incorrectly marked as completed and has been fixed" 
        };
      }
    }
    
    return { success: true, fixed: false };
  } catch (error) {
    console.error("Error syncing AI match status:", error);
    return { success: false, error };
  }
};
