
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type MessageDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  userId: string;
  onMessageSent: () => void;
};

export const MessageDialog = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  userId,
  onMessageSent,
}: MessageDialogProps) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);

      // Insert the message
      const { error } = await supabase.from("messages").insert({
        sender_id: userId,
        recipient_id: companyId,
        content: message,
      });

      if (error) {
        throw error;
      }

      // Clear the form
      setMessage("");
      
      // Call the onMessageSent callback
      onMessageSent();
      
      // Close the dialog
      onClose();

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect with {companyName}</DialogTitle>
          <DialogDescription>
            Send a message to start a conversation and explore potential collaboration.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Introduce yourself and explain why you're interested in connecting..."
            className="min-h-[120px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
