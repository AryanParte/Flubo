
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
        match_score,
        summary,
        startup_id,
        completed,
        profiles!ai_persona_chats_startup_id_fkey (
          id,
          name,
          email,
          company
        )
      `)
      .eq('investor_id', investorId)
      .eq('completed', true)
      .order('match_score', { ascending: false });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching investor AI matches:", error);
    return { success: false, error, data: [] };
  }
};

/**
 * Fetches startup information with website data
 */
export const fetchStartupsWithWebsiteData = async (startupIds: string[]) => {
  if (!startupIds || startupIds.length === 0) return [];
  
  try {
    const { data, error } = await supabase
      .from('startup_profiles')
      .select('id, name, website, websiteUrl')
      .in('id', startupIds);
      
    if (error) {
      console.error("Error fetching startup website data:", error);
      return [];
    }
    
    console.log("Fetched startups with website data:", data);
    return data || [];
  } catch (error) {
    console.error("Error in fetchStartupsWithWebsiteData:", error);
    return [];
  }
};
