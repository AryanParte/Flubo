
import React, { useState } from "react";
import { Search, MoreHorizontal, Send, Paperclip, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";

export const MessagesTab = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>("Blue Venture Capital");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter chats based on search query
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      // Add the new message to the conversation
      const chatIndex = chats.findIndex(chat => chat.name === selectedChat);
      if (chatIndex !== -1) {
        const updatedChats = [...chats];
        updatedChats[chatIndex].messages.push({
          sender: "you",
          text: message,
          time: "Just now"
        });
        setChats(updatedChats);
        
        // Show toast notification
        toast({
          title: "Message sent",
          description: `Message sent to ${selectedChat}`,
        });
        
        // Clear the input field
        setMessage("");
        
        // Simulate a reply after 2 seconds
        setTimeout(() => {
          const updatedChats = [...chats];
          updatedChats[chatIndex].messages.push({
            sender: "them",
            text: "Thanks for your message. I'll get back to you shortly.",
            time: "Just now"
          });
          setChats(updatedChats);
        }, 2000);
      }
    }
  };

  const [chats, setChats] = useState([
    { 
      name: "Blue Venture Capital", 
      lastMessage: "Looking forward to our meeting next week!", 
      time: "10:30 AM", 
      unread: 0, 
      avatar: "B",
      messages: [
        { sender: "them", text: "Hi TechNova! We're impressed with your pitch.", time: "Yesterday" },
        { sender: "them", text: "Would you be available for a call next week?", time: "Yesterday" },
        { sender: "you", text: "Thank you! Yes, I'm available on Tuesday or Thursday.", time: "10:15 AM" },
        { sender: "them", text: "Looking forward to our meeting next week!", time: "10:30 AM" },
      ]
    },
    { 
      name: "Global Impact Fund", 
      lastMessage: "Let me know if you have any questions about the term sheet.", 
      time: "Yesterday", 
      unread: 2,
      avatar: "G",
      messages: [
        { sender: "them", text: "Hello, we'd like to discuss your funding requirements.", time: "2 days ago" },
        { sender: "you", text: "That would be great. We're looking to raise $2M.", time: "2 days ago" },
        { sender: "them", text: "Let me know if you have any questions about the term sheet.", time: "Yesterday" },
      ]
    },
    { 
      name: "Tech Accelerator Group", 
      lastMessage: "We'll review your application and get back to you soon.", 
      time: "Mar 15", 
      unread: 0,
      avatar: "T",
      messages: [
        { sender: "you", text: "Hi, I'm interested in your accelerator program.", time: "Mar 14" },
        { sender: "them", text: "Thanks for reaching out! Could you share more details about your startup?", time: "Mar 14" },
        { sender: "you", text: "We're building an AI-powered health platform. I've attached our deck.", time: "Mar 15" },
        { sender: "them", text: "We'll review your application and get back to you soon.", time: "Mar 15" },
      ]
    },
  ]);

  const filteredChats = searchQuery 
    ? chats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const selectedChatData = chats.find(chat => chat.name === selectedChat);
  
  const markAsRead = (chatName: string) => {
    const updatedChats = chats.map(chat => 
      chat.name === chatName ? { ...chat, unread: 0 } : chat
    );
    setChats(updatedChats);
  };

  const handleChatSelect = (chatName: string) => {
    setSelectedChat(chatName);
    markAsRead(chatName);
  };

  return (
    <div className="border border-border rounded-lg bg-background/50 flex h-[calc(100vh-15rem)]">
      {/* Chat list */}
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
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <div 
                key={chat.name}
                className={`p-3 cursor-pointer flex items-center border-b border-border/60 hover:bg-secondary/50 ${selectedChat === chat.name ? 'bg-secondary' : ''}`}
                onClick={() => handleChatSelect(chat.name)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {chat.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm truncate">{chat.name}</p>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white ml-2 text-xs">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          )}
        </div>
      </div>
      
      {/* Chat area */}
      {selectedChatData ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="p-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-accent/10 text-accent">
                  {selectedChatData.avatar}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium">{selectedChatData.name}</p>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={20} />
            </Button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedChatData.messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === 'you' 
                      ? 'bg-accent text-white rounded-br-none' 
                      : 'bg-secondary rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
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
            />
            <Button 
              type="submit" 
              variant="accent"
              size="icon"
              className="ml-2"
              disabled={!message.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Select a conversation to start messaging</p>
        </div>
      )}
    </div>
  );
};
