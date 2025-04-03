
import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
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
  
  // Load contacts
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const loadContacts = async () => {
      setLoading(true);
      try {
        // For now, we'll use some mock contacts
        // In a real app, you'd fetch these from your API
        const mockContacts = [
          {
            id: "contact-1",
            name: "John Doe",
            avatar: "",
            user_type: "investor"
          },
          {
            id: "contact-2",
            name: "Jane Smith",
            avatar: "",
            user_type: "investor"
          },
          {
            id: "contact-3",
            name: "Tech Startup Inc",
            avatar: "",
            user_type: "startup"
          }
        ];
        
        setContacts(mockContacts);
      } catch (error) {
        console.error("Error loading contacts:", error);
        toast({
          title: "Error loading contacts",
          description: "Could not load contacts. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // If we have a postId but no content, load the post details
    const loadPostDetails = async () => {
      if (!postId) return;
      
      try {
        // Here you'd fetch the post details from your API
        // For now, we'll use the provided props
        setPostDetails({
          content: postContent,
          image_url: postImage,
          author: postAuthor
        });
      } catch (error) {
        console.error("Error loading post details:", error);
      }
    };
    
    loadContacts();
    loadPostDetails();
  }, [isOpen, user, postId, postContent, postImage, postAuthor]);
  
  // Filter contacts based on search query
  const filteredContacts = searchQuery
    ? contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : contacts;
  
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
  };
  
  const handleShare = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to share posts",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedContact) {
      toast({
        title: "No recipient selected",
        description: "Please select a recipient to share with",
        variant: "default"
      });
      return;
    }
    
    setSending(true);
    
    try {
      // Here you'd implement your share functionality
      // For now, we'll just simulate a successful share
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Post shared",
        description: `Successfully shared post with ${selectedContact.name}`,
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      console.error("Error sharing post:", error);
      toast({
        title: "Error sharing post",
        description: "Could not share the post. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Post</DialogTitle>
          <DialogDescription>
            Share this post with your connections
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2 flex-1 overflow-hidden">
          {/* Post preview if sharing an existing post */}
          {postDetails && (
            <Card className="p-3 mb-4 bg-muted/30 border border-border/40 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={postDetails.author?.avatar} />
                  <AvatarFallback>{postDetails.author?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{postDetails.author?.name || "Unknown User"}</div>
              </div>
              
              <div className="text-sm line-clamp-2 mb-2">
                {postDetails.content}
              </div>
              
              {postDetails.image_url && (
                <div className="relative h-24 w-full bg-muted rounded overflow-hidden">
                  <img 
                    src={postDetails.image_url} 
                    alt="Post attachment" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </Card>
          )}
          
          {/* Message input */}
          <div className="mb-4">
            <Textarea
              placeholder="Add a message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          {/* Contact search */}
          <div className="mb-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Contacts list */}
          <ScrollArea className="h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading contacts...</span>
              </div>
            ) : filteredContacts.length > 0 ? (
              <div className="space-y-2 pr-3">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent/10 ${
                      selectedContact?.id === contact.id ? "bg-accent/20" : ""
                    }`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{contact.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{contact.user_type}</div>
                      </div>
                    </div>
                    
                    {selectedContact?.id === contact.id && (
                      <div className="h-4 w-4 rounded-full bg-accent" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {searchQuery ? "No contacts found matching your search" : "No contacts available"}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!selectedContact || sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Sharing...
              </>
            ) : (
              <>Share</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Legacy adapter component with renamed function
export function SharePostDialogLegacy(props: { 
  open?: boolean; 
  onOpenChange?: (open: boolean) => void; 
}) {
  const { open, onOpenChange } = props;
  
  return (
    <SharePostDialog
      isOpen={!!open}
      onClose={() => onOpenChange && onOpenChange(false)}
    />
  );
}
