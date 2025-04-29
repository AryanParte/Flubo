
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { createStartupInvestorConnection } from "./company-discovery-service";
import { executeSQL } from "@/lib/db-utils";

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
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content
      })
      .select(); // Add select to return the inserted row
    
    if (error) {
      throw error;
    }
    
    console.log("Message sent successfully:", data);
    return { success: true, message: data?.[0] };
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
        sender:sender_id(id, name, avatar_url, user_type),
        recipient:recipient_id(id, name, avatar_url, user_type)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('sent_at', { ascending: false })
      .limit(100);
    
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
          user_type: otherPerson?.user_type || 'unknown',
          last_message: message.content,
          last_message_time: message.sent_at,
          unread: !isUserSender && !message.read_at ? 1 : 0
        });
      } else if (new Date(message.sent_at) > new Date(conversationsMap.get(otherPersonId).last_message_time)) {
        // Update last message info if this is more recent
        const convo = conversationsMap.get(otherPersonId);
        convo.last_message = message.content;
        convo.last_message_time = message.sent_at;
        
        // Increment unread counter if this is an incoming unread message
        if (!isUserSender && !message.read_at) {
          convo.unread += 1;
        }
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
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
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
    const { data, error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('sender_id', senderId)
      .is('read_at', null)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`Marked ${data?.length || 0} messages as read`);
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

// Helper function to initialize realtime for messages
export const initializeRealtime = async () => {
  try {
    console.log("Initializing realtime functionality for messages");
    
    // First try to verify and set the replica identity using db-utils
    try {
      // Ensure messages table has REPLICA IDENTITY FULL
      await executeSQL("ALTER TABLE public.messages REPLICA IDENTITY FULL;");
      console.log("Successfully set REPLICA IDENTITY FULL for messages table via executeSQL");
      
      // Create or update the publication
      await executeSQL(`
        CREATE PUBLICATION IF NOT EXISTS supabase_realtime;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
      `);
      console.log("Added messages table to publication via executeSQL");
    } catch (e) {
      console.warn("Direct SQL execution attempt failed:", e);
    }
    
    // Then try the database functions
    try {
      console.log("Trying to use database functions for realtime setup...");
      
      const { error: replicaError } = await ((supabase.rpc as any)(
        'set_messages_replica_identity', 
        {}, 
        { count: 'exact' }
      ));
        
      if (replicaError) {
        console.log("Note: Error setting replica identity via RPC:", replicaError);
      } else {
        console.log("Successfully set REPLICA IDENTITY via RPC");
      }
      
      const { error: enableError } = await ((supabase.rpc as any)(
        'enable_realtime_for_messages', 
        {}, 
        { count: 'exact' }
      ));
        
      if (enableError) {
        console.log("Note: Error enabling realtime via RPC:", enableError);
      } else {
        console.log("Successfully enabled realtime via RPC");
      }
    } catch (e) {
      console.error("Error calling database functions:", e);
    }
    
    // Finally call the edge function as a comprehensive approach
    try {
      console.log("Calling edge function to ensure realtime is configured properly...");
      
      const { data, error } = await supabase.functions.invoke('enable-realtime');
      
      if (error) {
        console.log("Edge Function for realtime returned an error:", error);
        return { success: false, error };
      } else {
        console.log("Edge Function realtime initialization response:", data);
        return { success: true, data };
      }
    } catch (e) {
      console.error("Error calling realtime edge function:", e);
      return { success: false, error: e };
    }
  } catch (error) {
    console.error("Error in initializeRealtime function:", error);
    return { success: false, error };
  }
};

// Add debugging functions to help diagnose issues
export const checkRealtimeStatus = async () => {
  try {
    // Check message table replica identity
    const { data: replicaStatus, error: replicaError } = await supabase.rpc(
      'execute_sql',
      { 
        query: `
        SELECT relreplident 
        FROM pg_class 
        WHERE oid = 'public.messages'::regclass;
        `
      }
    );
    
    if (replicaError) {
      console.error("Error checking replica identity:", replicaError);
    } else {
      console.log("Messages table replica identity status:", replicaStatus);
    }
    
    // Check publication status
    const { data: pubStatus, error: pubError } = await supabase.rpc(
      'execute_sql',
      { 
        query: `
        SELECT * FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages';
        `
      }
    );
    
    if (pubError) {
      console.error("Error checking publication status:", pubError);
    } else {
      console.log("Messages table publication status:", pubStatus);
    }
    
    return {
      replicaIdentity: replicaStatus,
      publication: pubStatus
    };
  } catch (error) {
    console.error("Error checking realtime status:", error);
    return { error };
  }
};
