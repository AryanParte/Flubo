import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { createStartupInvestorConnection } from "./company-discovery-service";

export const sendMessage = async (
  senderId: string,
  recipientId: string,
  content: string
) => {
  try {
    // Check if the sender is a startup by checking the profiles table
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', senderId)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // If the sender is a startup, create a connection with the investor
    if (senderProfile.user_type === 'startup') {
      await createStartupInvestorConnection(senderId, recipientId);
    }
    
    // Send the message
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    toast({
      title: 'Error',
      description: 'Failed to send message',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};

export const getConversations = async (userId: string) => {
  try {
    // Get all conversations where the user is either the sender or recipient
    // Using a regular query instead of RPC since the get_conversations function is not defined
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        recipient_id,
        sent_at,
        read_at,
        sender:sender_id(id, name, avatar_url),
        recipient:recipient_id(id, name, avatar_url)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('sent_at', { ascending: false })
      .limit(50);
    
    if (error) {
      throw error;
    }
    
    // Process the data to get unique conversations
    const conversationsMap = new Map();
    
    data?.forEach(message => {
      // Determine if the user is the sender or recipient
      const isUserSender = message.sender_id === userId;
      const otherPersonId = isUserSender ? message.recipient_id : message.sender_id;
      const otherPerson = isUserSender ? message.recipient : message.sender;
      
      if (!conversationsMap.has(otherPersonId)) {
        conversationsMap.set(otherPersonId, {
          id: otherPersonId,
          name: otherPerson?.name || 'Unknown',
          avatar_url: otherPerson?.avatar_url,
          last_message: message.content,
          last_message_time: message.sent_at,
          unread: !isUserSender && !message.read_at ? 1 : 0
        });
      }
    });
    
    return Array.from(conversationsMap.values());
  } catch (error) {
    console.error('Error fetching conversations:', error);
    toast({
      title: 'Error',
      description: 'Failed to load conversations',
      variant: 'destructive',
    });
    return [];
  }
};

export const getMessages = async (userId: string, otherId: string) => {
  try {
    // Get all messages between the user and the other person
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .or(`sender_id.eq.${otherId},recipient_id.eq.${otherId}`)
      .order('sent_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    toast({
      title: 'Error',
      description: 'Failed to load messages',
      variant: 'destructive',
    });
    return [];
  }
};

export const markMessagesAsRead = async (userId: string, senderId: string) => {
  try {
    // Mark all messages from the sender to the user as read
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', senderId)
      .is('read_at', null);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

// New function to delete AI persona chat history
export const deleteAIPersonaChatHistory = async (startupId: string, investorId: string) => {
  try {
    console.log(`Deleting AI persona chat history between startup ${startupId} and investor ${investorId}`);
    
    // First, find all chats between this startup and investor
    const { data: chats, error: chatsError } = await supabase
      .from('ai_persona_chats')
      .select('id')
      .eq('startup_id', startupId)
      .eq('investor_id', investorId);
      
    if (chatsError) {
      console.error("Error finding AI persona chats:", chatsError);
      throw chatsError;
    }
    
    if (!chats || chats.length === 0) {
      console.log("No existing AI persona chats found to delete");
      return { success: true, message: "No chats found to delete" };
    }
    
    // Get all chat IDs
    const chatIds = chats.map(chat => chat.id);
    console.log(`Found ${chatIds.length} chats to delete`);
    
    // Delete all messages for these chats
    const { error: messagesDeleteError } = await supabase
      .from('ai_persona_messages')
      .delete()
      .in('chat_id', chatIds);
      
    if (messagesDeleteError) {
      console.error("Error deleting AI persona messages:", messagesDeleteError);
      throw messagesDeleteError;
    }
    
    // Delete the chat records
    const { error: chatsDeleteError } = await supabase
      .from('ai_persona_chats')
      .delete()
      .in('id', chatIds);
      
    if (chatsDeleteError) {
      console.error("Error deleting AI persona chats:", chatsDeleteError);
      throw chatsDeleteError;
    }
    
    return { success: true, message: `Deleted ${chatIds.length} chat(s) successfully` };
    
  } catch (error) {
    console.error("Error in deleteAIPersonaChatHistory:", error);
    return { success: false, error };
  }
};
