
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
 * Syncs AI persona chat matches to the investor_matches table
 * This ensures that all completed AI chats have corresponding entries in investor_matches
 */
export const syncAIPersonaMatchesToInvestorMatches = async (investorId: string) => {
  try {
    // Get all completed AI chats for this investor
    const { data: completedChats, error: chatsError } = await supabase
      .from('ai_persona_chats')
      .select('id, startup_id, match_score, completed')
      .eq('investor_id', investorId)
      .eq('completed', true);
      
    if (chatsError) throw chatsError;
    if (!completedChats || completedChats.length === 0) return { success: true, message: "No completed chats found" };
    
    // For each completed chat, ensure there's a corresponding investor_match
    for (const chat of completedChats) {
      // Check if a match already exists
      const { data: existingMatch, error: matchCheckError } = await supabase
        .from('investor_matches')
        .select('id, match_score')
        .eq('investor_id', investorId)
        .eq('startup_id', chat.startup_id)
        .maybeSingle();
        
      if (matchCheckError) continue; // Skip this one if there's an error
      
      if (existingMatch) {
        // Update the existing match if the score is different
        if (existingMatch.match_score !== chat.match_score) {
          await supabase
            .from('investor_matches')
            .update({ match_score: chat.match_score })
            .eq('id', existingMatch.id);
        }
      } else {
        // Create a new match
        await supabase
          .from('investor_matches')
          .insert({
            investor_id: investorId,
            startup_id: chat.startup_id,
            match_score: chat.match_score,
            status: 'pending'
          });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error syncing AI matches:", error);
    return { success: false, error };
  }
};
