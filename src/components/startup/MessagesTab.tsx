import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, MoreHorizontal, Send, Paperclip, Image, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { SharedPostPreview } from "@/components/shared/SharedPostPreview";
import { sendMessage } from "@/services/message-service";
import { REALTIME_SUBSCRIBE_STATES, REALTIME_CHANNEL_STATES } from "@supabase/supabase-js";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  sent_at: string;
  read_at: string | null;
};

type Conversation = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  user_type: string;
  messages: {
    id?: string;
    sender: "you" | "them";
    text: string;
    time: string;
  }[];
  last_message_time: Date;
};

export const MessagesTab = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string>("CLOSED");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const firstLoadRef = useRef(true);
  
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const processMessages = useCallback((messages: any[]) => {
    if (!userId) return;
    
    const conversationMap = new Map();
    
    messages.forEach((msg: any) => {
      const isUserSender = msg.sender_id === userId;
      const partnerId = isUserSender ? msg.recipient_id : msg.sender_id;
      const partnerData = isUserSender ? msg.recipient : msg.sender;
      
      if (!partnerData) {
        console.log("Missing partner data for message:", msg);
        return; // Skip if partner data is missing
      }
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          id: partnerId,
          name: partnerData.name || "Unknown User",
          avatar: partnerData.name ? partnerData.name.charAt(0).toUpperCase() : "?",
          user_type: partnerData.user_type || "unknown",
          messages: [],
          lastMessage: "",
          time: "",
          unread: 0,
          last_message_time: new Date(0) // Add this to track the actual timestamp
        });
      }
      
      const convo = conversationMap.get(partnerId);
      convo.messages.push({
        id: msg.id,
        sender: isUserSender ? "you" : "them",
        text: msg.content,
        time: formatMessageTime(msg.sent_at)
      });
      
      // Track the most recent message time for sorting
      const msgTime = new Date(msg.sent_at);
      if (msgTime > convo.last_message_time) {
        convo.last_message_time = msgTime;
      }
      
      if (!isUserSender && !msg.read_at) {
        convo.unread += 1;
      }
    });
    
    conversationMap.forEach(convo => {
      convo.messages.sort((a: any, b: any) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      
      if (convo.messages.length > 0) {
        const lastMsg = convo.messages[convo.messages.length - 1];
        convo.lastMessage = lastMsg.text;
        convo.time = lastMsg.time;
      }
    });
    
    // Convert to array and sort by most recent message
    const conversationsArray = Array.from(conversationMap.values()).sort((a, b) => 
      b.last_message_time.getTime() - a.last_message_time.getTime()
    );
    
    console.log("Conversations processed:", conversationsArray.length);
    
    setConversations(conversationsArray);
    
    if (conversationsArray.length > 0 && !selectedChat && firstLoadRef.current) {
      setSelectedChat(conversationsArray[0].id);
      firstLoadRef.current = false;
    }
    
    setLoading(false);
  }, [userId, selectedChat]);

  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log("Fetching messages for user:", userId);
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(name, user_type), recipient:recipient_id(name, user_type)')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('sent_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Messages fetched:", messages?.length || 0);
      processMessages(messages || []);
    } catch (error) {
      console.error("Error processing conversations:", error);
      setLoading(false);
    }
  }, [userId, processMessages]);

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId, fetchMessages]);
  
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!userId || !selectedChat) return;
      
      try {
        // Find unread messages from the selected chat partner
        const unreadMessages = await supabase
          .from('messages')
          .select('id')
          .eq('sender_id', selectedChat)
          .eq('recipient_id', userId)
          .is('read_at', null);
          
        if (unreadMessages.error) {
          console.error("Error finding unread messages:", unreadMessages.error);
          return;
        }
        
        if (unreadMessages.data && unreadMessages.data.length > 0) {
          console.log(`Marking ${unreadMessages.data.length} messages as read`);
          
          // Update all unread messages from this sender
          const { error: updateError } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('sender_id', selectedChat)
            .eq('recipient_id', userId)
            .is('read_at', null);
            
          if (updateError) {
            console.error("Error marking messages as read:", updateError);
          } else {
            // Update local state to remove unread indicators
            setConversations(prev => prev.map(convo => {
              if (convo.id === selectedChat) {
                return { ...convo, unread: 0 };
              }
              return convo;
            }));
          }
        }
      } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
      }
    };
    
    markMessagesAsRead();
  }, [selectedChat, userId]);
  
  const handleRealtimeUpdate = useCallback((payload: { new: Message; old: Message; eventType: string }) => {
    console.log("Realtime message update:", payload);
    
    if (userId && 
        (payload.new?.sender_id === userId || payload.new?.recipient_id === userId || 
         payload.old?.sender_id === userId || payload.old?.recipient_id === userId)) {
      
      fetchMessages();
      
      if (payload.eventType === 'INSERT' && payload.new?.recipient_id === userId) {
        toast({
          title: "New Message",
          description: "You have received a new message",
        });
      }
    }
  }, [userId, fetchMessages]);

  const channel = useRealtimeSubscription<Message>(
    'messages',
    ['INSERT', 'UPDATE', 'DELETE'],
    handleRealtimeUpdate
  );
  
  useEffect(() => {
    if (channel) {
      console.log("Channel established:", channel);
      setRealtimeStatus(channel.state);
      
      const testConnectionInterval = setInterval(() => {
        if (channel.state !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          console.log("Channel not in SUBSCRIBED state:", channel.state);
          // Don't attempt to resubscribe, the hook handles reconnection
        }
      }, 10000);
      
      return () => {
        clearInterval(testConnectionInterval);
      };
    } else {
      setRealtimeStatus("CLOSED");
    }
  }, [channel]);

  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return "Unknown";
    
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedChat || !userId || sendingMessage) {
      return;
    }
    
    try {
      setSendingMessage(true);
      
      // Create the new message object for optimistic update
      const now = new Date().toISOString();
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        sender: "you" as const,
        text: message.trim(),
        time: formatMessageTime(now)
      };
      
      // Apply optimistic update to UI
      setConversations(prev => 
        prev.map(convo => {
          if (convo.id === selectedChat) {
            // Update the conversation with the new message
            return {
              ...convo,
              messages: [...convo.messages, optimisticMessage],
              lastMessage: optimisticMessage.text,
              time: optimisticMessage.time,
              last_message_time: new Date(now)
            };
          }
          return convo;
        })
      );
      
      // Clear the input immediately for better UX
      setMessage("");
      
      // Scroll to bottom immediately for better UX
      setTimeout(scrollToBottom, 50);
      
      // Now send the actual message to the server
      const { success, error, message: sentMessage } = await sendMessage(
        userId,
        selectedChat,
        optimisticMessage.text
      );
        
      if (!success) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        
        // Could revert the optimistic update here if needed, but usually
        // it's better to keep the UI consistent
        return;
      }
      
      console.log("Message sent successfully:", sentMessage);
      
      // Update the temporary message with the real message ID
      if (sentMessage && sentMessage.id) {
        setConversations(prev => 
          prev.map(convo => {
            if (convo.id === selectedChat) {
              return {
                ...convo,
                messages: convo.messages.map(msg => 
                  msg.id === optimisticMessage.id
                    ? { ...msg, id: sentMessage.id }
                    : msg
                )
              };
            }
            return convo;
          })
        );
      }
      
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const renderMessageContent = (msg: any) => {
    // Check if message content is JSON and contains a shared post
    try {
      const contentObj = JSON.parse(msg.text);
      
      if (contentObj.type === "shared_post" && contentObj.post) {
        return (
          <div>
            {contentObj.message && (
              <p className="text-sm mb-1">{contentObj.message}</p>
            )}
            <SharedPostPreview 
              postId={contentObj.post.id}
              content={contentObj.post.content}
              imageUrl={contentObj.post.image_url}
              author={contentObj.post.author}
              compact
            />
          </div>
        );
      }
    } catch (e) {
      // Not JSON or not a shared post, just render as regular text
    }
    
    // Default text rendering
    return <p className="text-sm">{msg.text}</p>;
  };

  const filteredConversations = searchQuery 
    ? conversations.filter(convo => convo.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const selectedChatData = conversations.find(convo => convo.id === selectedChat);

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const getUserTypeLabel = (userType: string): string => {
    switch (userType) {
      case 'investor':
        return 'Investor';
      case 'startup':
        return 'Business';
      default:
        return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-2">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-background/50 flex h-[calc(100vh-15rem)] relative">
      <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
        <span>Realtime:</span>
        {realtimeStatus === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED ? (
          <div className="flex items-center text-green-500">
            <Wifi size={14} className="mr-1" />
            <span>Connected</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-500">
            <WifiOff size={14} className="mr-1" />
            <span>{realtimeStatus}</span>
          </div>
        )}
      </div>
      
      <div className="w-1/3 border-r border-border">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search conversations"
              className="pl-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-56px)]">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((convo) => (
              <div 
                key={convo.id}
                className={`p-3 cursor-pointer flex items-center border-b border-border/60 hover:bg-secondary/50 ${selectedChat === convo.id ? 'bg-secondary' : ''}`}
                onClick={() => handleChatSelect(convo.id)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {convo.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <p className="font-medium text-sm truncate">{convo.name}</p>
                      <span className="ml-2 text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                        {getUserTypeLabel(convo.user_type)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{convo.lastMessage}</p>
                </div>
                {convo.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white ml-2 text-xs">
                    {convo.unread}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          )}
        </div>
      </div>
      
      {selectedChatData ? (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-accent/10 text-accent">
                  {selectedChatData.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedChatData.name}</p>
                <p className="text-xs text-muted-foreground">{getUserTypeLabel(selectedChatData.user_type)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={20} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedChatData.messages.length > 0 ? (
              selectedChatData.messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender === 'you' 
                        ? 'bg-accent text-white rounded-br-none' 
                        : 'bg-secondary rounded-bl-none'
                    }`}
                  >
                    {renderMessageContent(msg)}
                    <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="border-t border-border p-3 flex items-center">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground"
              onClick={() => {
                toast({
                  title: "Attachment",
                  description: "File upload functionality coming soon",
                });
              }}
            >
              <Paperclip size={18} />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground mr-2"
              onClick={() => {
                toast({
                  title: "Image",
                  description: "Image upload functionality coming soon",
                });
              }}
            >
              <Image size={18} />
            </Button>
            <Input
              placeholder="Type a message..."
              className="flex-1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendingMessage}
            />
            <Button 
              type="submit" 
              variant="accent"
              size="icon"
              className="ml-2"
              disabled={!message.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            {filteredConversations.length > 0 
              ? "Select a conversation to start messaging" 
              : "No conversations yet. Messages from businesses and investors will appear here."}
          </p>
        </div>
      )}
    </div>
  );
};
