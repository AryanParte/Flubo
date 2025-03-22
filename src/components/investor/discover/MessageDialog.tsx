
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  startupId: string;
  startupName: string;
  userId: string;
  onMessageSent: () => void;
}

export const MessageDialog = ({
  isOpen,
  onClose,
  startupId,
  startupName,
  userId,
  onMessageSent
}: MessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please write a message before sending",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      
      // Insert message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          content: message.trim(),
          sender_id: userId,
          recipient_id: startupId,
          sent_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Message sent",
        description: `Your message has been sent to ${startupName}`,
      });
      
      // Clear input and close dialog
      setMessage("");
      onClose();
      
      // Trigger any additional actions after message is sent
      onMessageSent();
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a message to {startupName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Textarea
            placeholder={`Introduce yourself to ${startupName}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This will be your first message to the startup and will initiate a conversation.
          </p>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button 
            variant="accent" 
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
