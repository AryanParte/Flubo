
import { useState } from "react";
import { Mail, Briefcase, Building, MapPin, Tags, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Investor } from "../../../types/investor";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
      
      // Navigate to messages page - use /business/messages instead of /startup/messages
      navigate('/business/messages');
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12 rounded-full">
            {investor.avatar_url ? (
              <AvatarImage src={investor.avatar_url} alt={investor.name} />
            ) : (
              <AvatarFallback className="bg-accent/10 text-accent">
                {investor.name?.charAt(0) || 'I'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-base">{investor.name}</h3>
            
            <div className="space-y-1 mt-2">
              <p className="text-xs text-muted-foreground flex items-center">
                <Briefcase size={12} className="mr-1 flex-shrink-0" />
                <span>{investor.role || "Investor"} at {investor.company || "Independent"}</span>
              </p>
              
              {investor.industry && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <Building size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.industry}</span>
                </p>
              )}
              
              {investor.location && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <MapPin size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.location}</span>
                </p>
              )}
              
              {investor.preferred_stages && investor.preferred_stages.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-start">
                  <Tags size={12} className="mr-1 mt-1 flex-shrink-0" />
                  <span>{investor.preferred_stages.join(", ")}</span>
                </p>
              )}
              
              {investor.investment_size && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <DollarSign size={12} className="mr-1 flex-shrink-0" />
                  <span>{investor.investment_size}</span>
                </p>
              )}
            </div>
          </div>
        </div>
        
        {investor.bio && (
          <p className="text-sm mt-3 line-clamp-2">{investor.bio}</p>
        )}
        
        {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {investor.preferred_sectors.map((sector, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {sector}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Button
          variant="accent"
          size="sm"
          className="w-full flex items-center justify-center"
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
      </CardFooter>
    </Card>
  );
};
