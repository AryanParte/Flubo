
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

/**
 * Gets custom questions for an investor's AI persona
 * Enhanced with better logging and validation
 */
export const getInvestorAIPersonaQuestions = async (investorId: string) => {
  try {
    console.log(`Fetching AI persona questions for investor ${investorId}`);
    
    const { data, error } = await supabase
      .from('investor_ai_persona_settings')
      .select('*') // Select all fields for debugging
      .eq('user_id', investorId)
      .maybeSingle();
      
    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log(`No AI persona settings found for investor ${investorId}`);
        return { data: { custom_questions: [] }, success: true };
      }
      console.error(`Error fetching AI persona settings: ${error.message}`);
      throw error;
    }
    
    // Validate that custom_questions is properly structured
    if (data && Array.isArray(data.custom_questions)) {
      console.log(`Successfully fetched AI persona settings for investor ${investorId}`);
      console.log(`Custom questions: ${JSON.stringify(data.custom_questions, null, 2)}`);
      console.log(`Custom questions count: ${data.custom_questions?.length || 0}`);
      
      // Log each question individually to verify structure
      if (data.custom_questions && data.custom_questions.length > 0) {
        data.custom_questions.forEach((q, i) => {
          console.log(`Question ${i}: ${JSON.stringify(q)}`);
          if (typeof q.question !== 'string') {
            console.error(`Question ${i} has invalid structure:`, q);
          }
        });
      }
    } else {
      console.error(`Invalid custom_questions format: ${typeof data?.custom_questions}`);
      // Return empty array to prevent errors
      return { 
        data: { 
          ...data, 
          custom_questions: [] 
        }, 
        success: true 
      };
    }
    
    return { data, success: true };
  } catch (error) {
    console.error("Error getting AI persona questions:", error);
    return { data: { custom_questions: [] }, success: false, error };
  }
};

/**
 * Ensures all custom questions are asked during an AI chat
 */
export const ensureAllQuestionsAsked = async (chatId: string, investorId: string) => {
  try {
    // Get the custom questions
    const { data: settingsData } = await getInvestorAIPersonaQuestions(investorId);
    
    if (!settingsData || !settingsData.custom_questions) {
      console.log(`No custom questions found for investor ${investorId}`);
      return { success: true, complete: false };
    }
    
    console.log(`Found ${settingsData.custom_questions.length} total custom questions`);
    const customQuestions = settingsData.custom_questions.filter(q => q.enabled !== false);
    console.log(`${customQuestions.length} questions are enabled`);
    
    if (customQuestions.length > 0) {
      console.log(`Example question: "${customQuestions[0].question}"`);
    }
    
    // Get all messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('ai_persona_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (messagesError) throw messagesError;
    
    if (!messages || messages.length === 0) {
      return { success: true, complete: false };
    }
    
    // Check if all custom questions have been asked
    const askedQuestions = new Set();
    
    messages.forEach(msg => {
      if (msg.sender_type === 'ai') {
        customQuestions.forEach(q => {
          // More precise matching to ensure we're correctly identifying asked questions
          const questionLower = q.question.toLowerCase();
          const msgLower = msg.content.toLowerCase();
          
          // Check for substantial match
          const isMatch = msgLower.includes(questionLower) || 
                      (questionLower.length > 30 && 
                       msgLower.includes(questionLower.substring(0, 30)));
                       
          if (isMatch) {
            console.log(`Question "${q.question}" has been asked`);
            askedQuestions.add(q.id);
          }
        });
      }
    });
    
    console.log(`${askedQuestions.size}/${customQuestions.length} questions have been asked`);
    const allQuestionsAsked = customQuestions.every(q => askedQuestions.has(q.id));
    
    // If the chat is marked as complete but not all questions were asked, fix it
    if (allQuestionsAsked) {
      const { data: chat, error: chatError } = await supabase
        .from('ai_persona_chats')
        .select('completed')
        .eq('id', chatId)
        .single();
        
      if (chatError) throw chatError;
      
      // If the chat is not marked as complete but all questions were asked
      if (!chat.completed && messages[messages.length - 1].sender_type === 'startup') {
        // This chat could potentially be completed - the AI should generate a final response
        console.log(`All questions asked and last message is from startup, chat can be completed`);
        return { success: true, complete: true, needsFinalResponse: true };
      }
    }
    
    return { success: true, complete: allQuestionsAsked };
  } catch (error) {
    console.error("Error ensuring all questions asked:", error);
    return { success: false, error, complete: false };
  }
};
