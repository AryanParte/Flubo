
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, X, Search, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  user_type: string;
}

export interface SharePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  postContent?: string;
  postImage?: string | null;
  postAuthor?: {
    name: string;
    avatar: string;
  };
}

export function SharePostDialog({ 
  isOpen, 
  onClose,
  postId,
  postContent,
  postImage,
  postAuthor
}: SharePostDialogProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [postDetails, setPostDetails] = useState<any>(null);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!postAuthor && postId) {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select('content, image_url, user_id, profiles:user_id(name)')
            .eq('id', postId)
            .single();
            
          if (error) {
            console.error("Error fetching post details:", error);
            return;
          }
          
          if (data) {
            setPostDetails(data);
          }
        } catch (error) {
          console.error("Error in fetchPostDetails:", error);
        }
      }
    };
    
    fetchPostDetails();
  }, [postId, postAuthor]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id || !isOpen) return;
      
      setLoading(true);
      try {
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
        
        const contactMap = new Map<string, Contact>();
        
        messages?.forEach((msg: any) => {
          if (msg.sender_id === user.id && msg.recipient) {
            const contact = {
              id: msg.recipient.id,
              name: msg.recipient.name || "Unknown",
              avatar: msg.recipient.name ? msg.recipient.name.charAt(0).toUpperCase() : "?",
              user_type: msg.recipient.user_type || "unknown"
            };
            contactMap.set(contact.id, contact);
          }
          
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
      
      const postPreview = {
        id: postId,
        content: postContent,
        image_url: postImage,
        author: postAuthor || (postDetails?.profiles ? { 
          name: postDetails.profiles.name, 
          avatar: postDetails.profiles.name.charAt(0).toUpperCase() 
        } : null)
      };
      
      const shareMessage = JSON.stringify({
        type: "shared_post",
        message: message || "Shared a post with you",
        post: postPreview
      });
      
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
        
        <div className="mt-2 mb-4">
          <Card className="p-3 bg-secondary/50 border border-border/50">
            <div className="flex items-start space-x-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {postAuthor?.avatar || (postDetails?.profiles?.name.charAt(0).toUpperCase() || '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm truncate">
                  {postAuthor?.name || postDetails?.profiles?.name || 'Unknown User'}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {postContent}
            </div>
            {postImage || postDetails?.image_url ? (
              <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                <img 
                  src={postImage || postDetails?.image_url} 
                  alt="Post image"
                  className="object-cover w-full h-full"
                />
              </div>
            ) : null}
          </Card>
        </div>
        
        <div className="space-y-4">
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
}

// Compatibility layer for components that might be using the old API
interface LegacySharePostDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Legacy adapter component
export function SharePostDialogLegacy(props: LegacySharePostDialogProps) {
  const { open, onOpenChange } = props;
  
  return (
    <SharePostDialog 
      isOpen={open || false}
      onClose={() => onOpenChange && onOpenChange(false)}
    />
  );
}
