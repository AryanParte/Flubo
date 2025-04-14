
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

/**
 * Clears AI persona chat history from the database
 * Handles deleting from related tables in the correct order to respect foreign key constraints
 */
export const clearAIPersonaChats = async () => {
  try {
    // First delete entries from ai_match_feed_status that reference ai_persona_chats
    const { error: statusError } = await supabase
      .from('ai_match_feed_status')
      .delete()
      .neq('chat_id', ''); // Delete all entries
    
    if (statusError) {
      console.error("Error deleting ai_match_feed_status:", statusError);
      throw statusError;
    }
    
    // Then delete all messages from ai_persona_messages
    const { error: messagesError } = await supabase
      .from('ai_persona_messages')
      .delete()
      .neq('chat_id', ''); // Delete all entries
    
    if (messagesError) {
      console.error("Error deleting ai_persona_messages:", messagesError);
      throw messagesError;
    }
    
    // Finally delete all chat records from ai_persona_chats
    const { error: chatsError } = await supabase
      .from('ai_persona_chats')
      .delete()
      .neq('id', ''); // Delete all entries
    
    if (chatsError) {
      console.error("Error deleting ai_persona_chats:", chatsError);
      throw chatsError;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing AI persona chat history:", error);
    toast({
      title: "Error",
      description: "Failed to clear AI persona chat history",
      variant: "destructive",
    });
    return { success: false, error };
  }
};

/**
 * Clears AI persona chat history for a specific startup and investor
 */
export const clearSpecificAIPersonaChat = async (startupId: string, investorId: string) => {
  try {
    // Get the chat IDs for this specific startup-investor pair
    const { data: chats, error: chatQueryError } = await supabase
      .from('ai_persona_chats')
      .select('id')
      .eq('startup_id', startupId)
      .eq('investor_id', investorId);
    
    if (chatQueryError) {
      console.error("Error querying chats:", chatQueryError);
      throw chatQueryError;
    }
    
    if (!chats || chats.length === 0) {
      return { success: true, message: "No chats found to delete" };
    }
    
    const chatIds = chats.map(chat => chat.id);
    
    // Delete status entries for these chats
    const { error: statusError } = await supabase
      .from('ai_match_feed_status')
      .delete()
      .in('chat_id', chatIds);
    
    if (statusError) {
      console.error("Error deleting status entries:", statusError);
      throw statusError;
    }
    
    // Delete messages for these chats
    const { error: messagesError } = await supabase
      .from('ai_persona_messages')
      .delete()
      .in('chat_id', chatIds);
    
    if (messagesError) {
      console.error("Error deleting messages:", messagesError);
      throw messagesError;
    }
    
    // Delete the chats themselves
    const { error: chatsError } = await supabase
      .from('ai_persona_chats')
      .delete()
      .in('id', chatIds);
    
    if (chatsError) {
      console.error("Error deleting chats:", chatsError);
      throw chatsError;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error clearing specific AI persona chat:", error);
    toast({
      title: "Error",
      description: "Failed to clear AI persona chat history",
      variant: "destructive",
    });
    return { success: false, error };
  }
};
