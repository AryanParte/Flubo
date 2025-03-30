
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  user_type: string;
}

interface SharePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
}

export const SharePostDialog = ({
  isOpen,
  onClose,
  postId,
  postContent
}: SharePostDialogProps) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch the user's contacts (people they've messaged before)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id || !isOpen) return;
      
      setLoading(true);
      try {
        // Get unique contacts from messages (either sender or recipient)
        const { data: messages, error } = await supabase
          .from('messages')
          .select('sender_id, recipient_id, sender:sender_id(id, name, user_type), recipient:recipient_id(id, name, user_type)')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        
        if (error) {
          console.error("Error fetching contacts:", error);
          toast({
            title: "Error",
            description: "Could not load your contacts",
            variant: "destructive",
          });
          return;
        }
        
        // Process messages to get unique contacts
        const contactMap = new Map<string, Contact>();
        
        messages?.forEach((msg: any) => {
          // If user is the sender, add recipient as contact
          if (msg.sender_id === user.id && msg.recipient) {
            const contact = {
              id: msg.recipient.id,
              name: msg.recipient.name || "Unknown",
              avatar: msg.recipient.name ? msg.recipient.name.charAt(0).toUpperCase() : "?",
              user_type: msg.recipient.user_type || "unknown"
            };
            contactMap.set(contact.id, contact);
          }
          
          // If user is the recipient, add sender as contact
          if (msg.recipient_id === user.id && msg.sender) {
            const contact = {
              id: msg.sender.id,
              name: msg.sender.name || "Unknown",
              avatar: msg.sender.name ? msg.sender.name.charAt(0).toUpperCase() : "?",
              user_type: msg.sender.user_type || "unknown"
            };
            contactMap.set(contact.id, contact);
          }
        });
        
        // Convert map to array and set state
        setContacts(Array.from(contactMap.values()));
      } catch (error) {
        console.error("Error in fetchContacts:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [user?.id, isOpen]);

  const handleSendShare = async () => {
    if (!selectedContact || !user?.id) {
      toast({
        title: "Select a contact",
        description: "Please select a contact to share with",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      const shareMessage = message 
        ? `${message}\n\nShared post: ${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}\n\nView full post: ${window.location.origin}/post/${postId}`
        : `Shared post: ${postContent.substring(0, 100)}${postContent.length > 100 ? '...' : ''}\n\nView full post: ${window.location.origin}/post/${postId}`;
      
      // Insert message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          content: shareMessage,
          sender_id: user.id,
          recipient_id: selectedContact.id,
          sent_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error sharing post:", error);
        toast({
          title: "Error",
          description: "Failed to share post",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Post shared",
        description: `Your post has been shared with ${selectedContact.name}`,
      });
      
      // Clear input and close dialog
      setMessage("");
      setSelectedContact(null);
      onClose();
    } catch (error) {
      console.error("Error in handleSendShare:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = searchQuery 
    ? contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : contacts;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md">
            <ScrollArea className="h-48">
              {loading ? (
                <div className="flex items-center justify-center h-full py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Loading contacts...</span>
                </div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    className={`p-3 cursor-pointer flex items-center border-b border-border/60 hover:bg-secondary/50 ${selectedContact?.id === contact.id ? 'bg-secondary' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-accent/10 text-accent">
                        {contact.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <span className="ml-2 text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full">
                          {contact.user_type === 'investor' ? 'Investor' : 'Business'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full p-4">
                  <p className="text-muted-foreground text-center">
                    {searchQuery 
                      ? "No contacts matching your search" 
                      : "No contacts found. Start a conversation with someone first."}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
          
          <Textarea
            placeholder="Add a message (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            variant="accent" 
            onClick={handleSendShare}
            disabled={sending || !selectedContact}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
