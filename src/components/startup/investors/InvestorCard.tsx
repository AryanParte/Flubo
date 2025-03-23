
import { useState } from "react";
import { Mail, Briefcase, Building, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Investor } from "../../../types/investor";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface InvestorCardProps {
  investor: Investor;
}

export const InvestorCard = ({ investor }: InvestorCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);

  const handleMessageInvestor = async () => {
    try {
      setSendingMessage(investor.id);
      
      // Check if there's already a conversation with this investor
      const { data: existingMessages, error: messageError } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${investor.id}),and(sender_id.eq.${investor.id},recipient_id.eq.${user.id})`)
        .limit(1);
        
      if (messageError) throw messageError;
      
      // If there's no existing conversation, create an initial message
      if (!existingMessages || existingMessages.length === 0) {
        // Get the authenticated user's name from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        
        const userName = profileData?.name || "Unknown Startup";
        
        // Create initial message from startup to investor
        const { error } = await supabase
          .from('messages')
          .insert({
            content: `Hello from ${userName}! We're interested in connecting with you.`,
            sender_id: user.id,
            recipient_id: investor.id,
            sent_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }
      
      toast({
        title: "Investor contacted",
        description: `You can now message ${investor.name} directly.`,
      });
      
      // Navigate to messages page
      navigate('/startup/messages');
    } catch (error) {
      console.error("Error messaging investor:", error);
      toast({
        title: "Error",
        description: "Failed to contact investor",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(null);
    }
  };

  return (
    <div className="p-4 border border-border/60 rounded-lg bg-background/40 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <Avatar className="h-12 w-12 rounded-full">
          <AvatarFallback className="bg-accent/10 text-accent">
            {investor.name?.charAt(0) || 'I'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium text-base">{investor.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Briefcase size={12} className="mr-1" />
            {investor.role} at {investor.company}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <Building size={12} className="mr-1" />
            {investor.industry}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center">
            <MapPin size={12} className="mr-1" />
            {investor.location}
          </p>
          <p className="text-sm mt-3 line-clamp-2">{investor.bio}</p>
          
          <Button
            variant="accent"
            size="sm"
            className="w-full mt-4 flex items-center justify-center"
            onClick={handleMessageInvestor}
            disabled={sendingMessage === investor.id}
          >
            {sendingMessage === investor.id ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mail size={14} className="mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
