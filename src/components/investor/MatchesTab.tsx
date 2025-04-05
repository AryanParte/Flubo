import React, { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Startup } from "@/types/startup";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MatchCard } from "./matches/MatchCard";

export const MatchesTab = () => {
  const [aiMatches, setAiMatches] = useState<Startup[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingChat, setViewingChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, content: string}>>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      
      const { data: aiChats, error: aiError } = await supabase
        .from('ai_persona_chats')
        .select(`
          id,
          match_score,
          summary,
          startup_id,
          profiles!ai_persona_chats_startup_id_fkey (
            id,
            name,
            email,
            company,
            position
          )
        `)
        .eq('investor_id', user?.id)
        .eq('completed', true)
        .order('match_score', { ascending: false });
      
      if (aiError) {
        console.error("Error fetching AI matches:", aiError);
        toast({ title: "Error", description: "Failed to load AI matches", variant: "destructive" });
      } else if (aiChats) {
        const enhancedMatches = await Promise.all((aiChats || []).map(async (chat) => {
          const startup_id = chat.startup_id || '';
          const defaultStartup = {
            id: startup_id,
            name: "Unnamed Startup",
            stage: "Unknown",
            location: "Unknown",
            industry: "Technology",
            bio: "No description available",
            raisedAmount: "N/A",
            tagline: "No tagline available"
          };
          
          const profileData = chat.profiles;
          
          let startupProfileData = null;
          if (chat.startup_id) {
            const { data: profileData, error: profileError } = await supabase
              .from('startup_profiles')
              .select('stage, location, industry, bio, raised_amount, tagline, looking_for_funding, looking_for_design_partner')
              .eq('id', chat.startup_id)
              .maybeSingle();
              
            if (profileError) {
              console.error("Error fetching startup profile:", profileError);
            } else {
              startupProfileData = profileData;
            }
          }
          
          const { data: statusData } = await supabase
            .from('ai_match_feed_status')
            .select('status')
            .eq('investor_id', user?.id)
            .eq('startup_id', chat.startup_id)
            .eq('chat_id', chat.id)
            .maybeSingle();
          
          const status = statusData?.status || 'new';
          
          return {
            id: profileData ? profileData.id : startup_id,
            name: profileData ? profileData.name : defaultStartup.name,
            score: chat.match_score || 0,
            stage: startupProfileData?.stage || defaultStartup.stage,
            location: startupProfileData?.location || defaultStartup.location,
            industry: startupProfileData?.industry || defaultStartup.industry,
            bio: startupProfileData?.bio || defaultStartup.bio,
            raisedAmount: startupProfileData?.raised_amount || defaultStartup.raisedAmount,
            tagline: startupProfileData?.tagline || defaultStartup.tagline,
            lookingForFunding: startupProfileData?.looking_for_funding || false,
            lookingForDesignPartner: startupProfileData?.looking_for_design_partner || false,
            matchSummary: chat.summary || "No summary available",
            chatId: chat.id,
            matchStatus: (status as 'new' | 'viewed' | 'followed' | 'requested_demo' | 'ignored')
          };
        }));
        
        const filteredMatches = enhancedMatches.filter(
          match => match.matchStatus !== 'ignored'
        );
        
        setAiMatches(filteredMatches);
      }
      
      const { data: mutualMatches, error: mutualError } = await supabase
        .from('investor_matches')
        .select(`
          startup_id,
          match_score,
          status,
          profiles!investor_matches_startup_id_fkey (
            id,
            name,
            email,
            company,
            position
          )
        `)
        .eq('investor_id', user?.id)
        .eq('status', 'matched')
        .order('created_at', { ascending: false });
      
      if (mutualError) {
        console.error("Error fetching confirmed matches:", mutualError);
      } else if (mutualMatches) {
        const enhancedConfirmedMatches = await Promise.all((mutualMatches || []).map(async (match) => {
          const startup_id = match.startup_id || '';
          const defaultStartup = {
            id: startup_id,
            name: "Unnamed Startup",
            stage: "Unknown",
            location: "Unknown",
            industry: "Technology",
            bio: "No description available",
            raisedAmount: "N/A",
            tagline: "No tagline available"
          };
          
          const profileData = match.profiles;
          
          let startupProfileData = null;
          if (match.startup_id) {
            const { data: profileData, error: profileError } = await supabase
              .from('startup_profiles')
              .select('stage, location, industry, bio, raised_amount, tagline, looking_for_funding, looking_for_design_partner')
              .eq('id', match.startup_id)
              .maybeSingle();
              
            if (profileError) {
              console.error("Error fetching startup profile:", profileError);
            } else {
              startupProfileData = profileData;
            }
          }
          
          return {
            id: profileData ? profileData.id : startup_id,
            name: profileData ? profileData.name : defaultStartup.name,
            score: match.match_score || 0,
            stage: startupProfileData?.stage || defaultStartup.stage,
            location: startupProfileData?.location || defaultStartup.location,
            industry: startupProfileData?.industry || defaultStartup.industry,
            bio: startupProfileData?.bio || defaultStartup.bio,
            raisedAmount: startupProfileData?.raised_amount || defaultStartup.raisedAmount,
            tagline: startupProfileData?.tagline || defaultStartup.tagline,
            lookingForFunding: startupProfileData?.looking_for_funding || false,
            lookingForDesignPartner: startupProfileData?.looking_for_design_partner || false
          };
        }));
        
        setConfirmedMatches(enhancedConfirmedMatches);
      }
    } catch (error) {
      console.error("Error in fetchMatches:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewChat = async (chatId: string) => {
    try {
      setViewingChat(chatId);
      
      const currentMatch = aiMatches.find(match => match.chatId === chatId);
      if (currentMatch && currentMatch.matchStatus === 'new' && user) {
        await updateMatchStatus(currentMatch.id, chatId, 'viewed');
      }
      
      const { data, error } = await supabase
        .from('ai_persona_messages')
        .select('sender_type, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching chat messages:", error);
        toast({ title: "Error", description: "Failed to load chat messages", variant: "destructive" });
        return;
      }
      
      if (data) {
        const formattedMessages = data.map(msg => ({
          sender: msg.sender_type,
          content: msg.content
        }));
        
        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error viewing chat:", error);
      toast({
        title: "Error",
        description: "Failed to view chat",
        variant: "destructive",
      });
    }
  };

  const updateMatchStatus = async (startupId: string, chatId: string, status: string) => {
    try {
      if (!user) return;
      
      const { data: existingStatus } = await supabase
        .from('ai_match_feed_status')
        .select('id')
        .eq('investor_id', user.id)
        .eq('startup_id', startupId)
        .single();
      
      if (existingStatus) {
        await supabase
          .from('ai_match_feed_status')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existingStatus.id);
      } else {
        await supabase
          .from('ai_match_feed_status')
          .insert({
            investor_id: user.id,
            startup_id: startupId,
            chat_id: chatId,
            status
          });
      }
      
      setAiMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === startupId ? { ...match, matchStatus: status as any } : match
        )
      );
    } catch (error) {
      console.error("Error updating match status:", error);
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    }
  };

  const handleFollowStartup = async (startup: Startup) => {
    if (!startup.chatId || !user) return;
    
    try {
      await updateMatchStatus(startup.id, startup.chatId, 'followed');
      
      toast({
        title: "Startup followed",
        description: `You are now following ${startup.name}`,
      });
    } catch (error) {
      console.error("Error following startup:", error);
    }
  };

  const handleRequestDemo = async (startup: Startup) => {
    if (!startup.chatId || !user) return;
    
    try {
      await updateMatchStatus(startup.id, startup.chatId, 'requested_demo');
      
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: startup.id,
          content: `Hi! I've reviewed your information and I'm interested in learning more about ${startup.name}. Would you be available for a quick demo?`
        });
      
      toast({
        title: "Demo requested",
        description: `Demo request sent to ${startup.name}`,
      });
      
      navigate("/investor/messages");
    } catch (error) {
      console.error("Error requesting demo:", error);
    }
  };

  const handleIgnoreStartup = async (startup: Startup) => {
    if (!startup.chatId || !user) return;
    
    try {
      await updateMatchStatus(startup.id, startup.chatId, 'ignored');
      
      setAiMatches(prevMatches => 
        prevMatches.filter(match => match.id !== startup.id)
      );
      
      if (currentMatchIndex >= aiMatches.length - 1) {
        setCurrentMatchIndex(Math.max(0, aiMatches.length - 2));
      }
      
      toast({
        title: "Startup ignored",
        description: `${startup.name} has been removed from your feed`,
      });
    } catch (error) {
      console.error("Error ignoring startup:", error);
    }
  };

  const handleContactClick = (startupId: string) => {
    navigate("/investor/messages");
  };

  const showNextMatch = () => {
    if (currentMatchIndex < aiMatches.length - 1) {
      setCurrentMatchIndex(prev => prev + 1);
      setViewingChat(null);
    }
  };

  const showPrevMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(prev => prev - 1);
      setViewingChat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent mr-2" />
        <p>Loading matches...</p>
      </div>
    );
  }

  if (aiMatches.length === 0 && confirmedMatches.length === 0) {
    return (
      <div className="p-10 text-center rounded-lg border border-dashed border-border mb-8">
        <h3 className="text-xl font-medium mb-2">No Matches Yet</h3>
        <p className="text-muted-foreground mb-4">
          Your AI persona will help match you with startups that fit your investment criteria.
        </p>
        <Button onClick={() => document.getElementById("discover-tab-button")?.click()}>
          Discover Startups
        </Button>
      </div>
    );
  }

  const currentMatch = aiMatches[currentMatchIndex];

  return (
    <div>
      {aiMatches.length > 0 && !viewingChat && (
        <>
          <h2 className="text-xl font-semibold mb-6">AI Match Feed</h2>
          <div className="flex items-center justify-center mb-8">
            <div className="glass-card rounded-xl overflow-hidden w-full max-w-2xl">
              <div className="bg-gradient-to-r from-accent/20 to-accent/5 p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl">{aiMatches[currentMatchIndex]?.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="pr-2 mr-2 border-r border-border">{aiMatches[currentMatchIndex]?.stage}</span>
                      <span>{aiMatches[currentMatchIndex]?.location}</span>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-lg font-medium rounded-full px-4 py-2 flex items-center">
                    {aiMatches[currentMatchIndex]?.score}% Match
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Match Summary</h4>
                  <p className="text-muted-foreground">{aiMatches[currentMatchIndex]?.matchSummary}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">About {aiMatches[currentMatchIndex]?.name}</h4>
                  <p className="text-muted-foreground mb-3">{aiMatches[currentMatchIndex]?.bio || aiMatches[currentMatchIndex]?.tagline}</p>
                  
                  <div className="flex items-center text-sm mb-2">
                    <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
                      {aiMatches[currentMatchIndex]?.industry}
                    </div>
                    {aiMatches[currentMatchIndex]?.raisedAmount && aiMatches[currentMatchIndex]?.raisedAmount !== "N/A" && (
                      <div className="text-muted-foreground">
                        Raised: {aiMatches[currentMatchIndex]?.raisedAmount}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2 mb-4">
                  <Button 
                    variant="secondary"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleIgnoreStartup(aiMatches[currentMatchIndex])}
                  >
                    <ThumbsDown size={16} className="mr-1" />
                    <span>Not Interested</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleViewChat(aiMatches[currentMatchIndex]?.chatId!)}
                  >
                    <Eye size={16} className="mr-1" />
                    <span>View Conversation</span>
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="default"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleFollowStartup(aiMatches[currentMatchIndex])}
                  >
                    <ThumbsUp size={16} className="mr-1" />
                    <span>Follow</span>
                  </Button>
                  <Button 
                    variant="accent"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleRequestDemo(aiMatches[currentMatchIndex])}
                  >
                    <MessageSquare size={16} className="mr-1" />
                    <span>Request Demo</span>
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between p-4 border-t border-border">
                <Button 
                  variant="ghost" 
                  disabled={currentMatchIndex === 0}
                  onClick={showPrevMatch}
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentMatchIndex + 1} of {aiMatches.length}
                </span>
                <Button 
                  variant="ghost" 
                  disabled={currentMatchIndex === aiMatches.length - 1}
                  onClick={showNextMatch}
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {viewingChat && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="ghost" onClick={() => setViewingChat(null)} className="mr-2">
              <ChevronLeft size={16} className="mr-1" />
              Back to Matches
            </Button>
            <h3 className="text-lg font-medium">AI Conversation with {currentMatch?.name}</h3>
          </div>
          
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="p-4 bg-secondary/50 border-b border-border">
              <p className="text-sm text-muted-foreground">
                This is an AI-simulated conversation to determine startup fit
              </p>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] p-3 rounded-lg ${
                    msg.sender === 'ai' 
                      ? 'bg-secondary rounded-bl-none' 
                      : 'bg-accent text-white rounded-br-none'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {chatMessages.length === 0 && (
                <p className="text-center text-muted-foreground">No messages available</p>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Button 
                  variant="default"
                  className="flex-1 flex justify-center items-center"
                  onClick={() => {
                    if (currentMatch) handleFollowStartup(currentMatch);
                    setViewingChat(null);
                  }}
                >
                  <ThumbsUp size={16} className="mr-1" />
                  <span>Follow</span>
                </Button>
                <Button 
                  variant="accent"
                  className="flex-1 flex justify-center items-center"
                  onClick={() => {
                    if (currentMatch) handleRequestDemo(currentMatch);
                    setViewingChat(null);
                  }}
                >
                  <MessageSquare size={16} className="mr-1" />
                  <span>Request Demo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {confirmedMatches.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-4">Confirmed Matches</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {confirmedMatches.map((startup, index) => (
              <MatchCard
                key={startup.id}
                startup={startup}
                index={index}
                onRequestDemo={handleRequestDemo}
                onIgnore={handleIgnoreStartup}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
