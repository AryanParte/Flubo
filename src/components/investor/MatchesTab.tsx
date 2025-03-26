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
      
      // Fetch AI matches - startups that have chatted with this investor's AI persona
      const { data: aiChats, error: aiError } = await supabase
        .from('ai_persona_chats')
        .select(`
          id,
          match_score,
          summary,
          startup_id,
          profiles:startup_id (
            id,
            name,
            stage,
            location,
            industry,
            bio,
            raised_amount,
            tagline
          ),
          ai_match_feed_status (status)
        `)
        .eq('investor_id', user?.id)
        .eq('completed', true)
        .order('match_score', { ascending: false });
      
      if (aiError) {
        console.error("Error fetching AI matches:", aiError);
        toast({ title: "Error", description: "Failed to load AI matches", variant: "destructive" });
      } else if (aiChats) {
        // Transform the data for our Startup type
        const transformedAiMatches = aiChats.map(chat => {
          // Default values for startup info
          const startup_id = chat.startup_id || '';
          const defaultStartup = {
            id: startup_id,
            name: "Unnamed Startup",
            stage: "Unknown",
            location: "Unknown",
            industry: "Technology",
            bio: "No description available",
            raised_amount: "N/A",
            tagline: "No tagline available"
          };
          
          // Safely check if profiles exists and is a valid object
          // We'll use type assertion here to handle the null check
          const startupData = chat.profiles && 
                             typeof chat.profiles === 'object' ? 
                             chat.profiles as Record<string, any> : null;
          
          // Check if ai_match_feed_status exists and is an array with at least one element
          const statusItems = Array.isArray(chat.ai_match_feed_status) ? chat.ai_match_feed_status : [];
          const status = statusItems.length > 0 ? statusItems[0]?.status : 'new';
          
          return {
            id: startupData ? startupData.id : startup_id,
            name: startupData ? startupData.name : defaultStartup.name,
            score: chat.match_score || 0,
            stage: startupData ? startupData.stage : defaultStartup.stage,
            location: startupData ? startupData.location : defaultStartup.location,
            industry: startupData ? startupData.industry : defaultStartup.industry,
            bio: startupData ? startupData.bio : defaultStartup.bio,
            raised_amount: startupData ? startupData.raised_amount : defaultStartup.raised_amount,
            tagline: startupData ? startupData.tagline : defaultStartup.tagline,
            matchSummary: chat.summary || "No summary available",
            chatId: chat.id,
            matchStatus: (status as 'new' | 'viewed' | 'followed' | 'requested_demo' | 'ignored')
          };
        });

        // Filter out ignored matches
        const filteredMatches = transformedAiMatches.filter(
          match => match.matchStatus !== 'ignored'
        );
        
        setAiMatches(filteredMatches);
      }
      
      // Fetch confirmed matches (mutual interest)
      const { data: mutualMatches, error: mutualError } = await supabase
        .from('investor_matches')
        .select(`
          startup_id,
          match_score,
          status,
          profiles:startup_id (
            id,
            name,
            stage,
            location,
            industry,
            bio,
            raised_amount,
            tagline
          )
        `)
        .eq('investor_id', user?.id)
        .eq('status', 'matched')
        .order('created_at', { ascending: false });
      
      if (mutualError) {
        console.error("Error fetching confirmed matches:", mutualError);
      } else if (mutualMatches) {
        const transformedConfirmedMatches = mutualMatches.map(match => {
          // Default values for startup info
          const startup_id = match.startup_id || '';
          const defaultStartup = {
            id: startup_id,
            name: "Unnamed Startup",
            stage: "Unknown",
            location: "Unknown",
            industry: "Technology",
            bio: "No description available",
            raised_amount: "N/A",
            tagline: "No tagline available"
          };
          
          // Safely check if profiles exists and is a valid object
          // We'll use type assertion here to handle the null check
          const startupData = match.profiles && 
                             typeof match.profiles === 'object' ? 
                             match.profiles as Record<string, any> : null;
          
          return {
            id: startupData ? startupData.id : startup_id,
            name: startupData ? startupData.name : defaultStartup.name,
            score: match.match_score || 0,
            stage: startupData ? startupData.stage : defaultStartup.stage,
            location: startupData ? startupData.location : defaultStartup.location,
            industry: startupData ? startupData.industry : defaultStartup.industry,
            bio: startupData ? startupData.bio : defaultStartup.bio,
            raised_amount: startupData ? startupData.raised_amount : defaultStartup.raised_amount,
            tagline: startupData ? startupData.tagline : defaultStartup.tagline
          };
        });
        
        setConfirmedMatches(transformedConfirmedMatches);
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
      
      // Mark as viewed in the feed status
      const currentMatch = aiMatches.find(match => match.chatId === chatId);
      if (currentMatch && currentMatch.matchStatus === 'new' && user) {
        await updateMatchStatus(currentMatch.id, chatId, 'viewed');
      }
      
      // Fetch chat messages
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
      
      // Check if a status record already exists
      const { data: existingStatus } = await supabase
        .from('ai_match_feed_status')
        .select('id')
        .eq('investor_id', user.id)
        .eq('startup_id', startupId)
        .single();
      
      if (existingStatus) {
        // Update existing status
        await supabase
          .from('ai_match_feed_status')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existingStatus.id);
      } else {
        // Create new status record
        await supabase
          .from('ai_match_feed_status')
          .insert({
            investor_id: user.id,
            startup_id: startupId,
            chat_id: chatId,
            status
          });
      }
      
      // Update local state
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
      
      // Create a message to the startup
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
      
      // Remove from current view
      setAiMatches(prevMatches => 
        prevMatches.filter(match => match.id !== startup.id)
      );
      
      // Reset current index if needed
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

  // Show empty state if no matches
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
      {/* AI Match Feed */}
      {aiMatches.length > 0 && !viewingChat && (
        <>
          <h2 className="text-xl font-semibold mb-6">AI Match Feed</h2>
          <div className="flex items-center justify-center mb-8">
            <div className="glass-card rounded-xl overflow-hidden w-full max-w-2xl">
              {/* Match Card Header */}
              <div className="bg-gradient-to-r from-accent/20 to-accent/5 p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl">{currentMatch.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="pr-2 mr-2 border-r border-border">{currentMatch.stage}</span>
                      <span>{currentMatch.location}</span>
                    </div>
                  </div>
                  <div className="bg-accent/10 text-accent text-lg font-medium rounded-full px-4 py-2 flex items-center">
                    {currentMatch.score}% Match
                  </div>
                </div>
              </div>
              
              {/* Match Card Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Match Summary</h4>
                  <p className="text-muted-foreground">{currentMatch.matchSummary}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">About {currentMatch.name}</h4>
                  <p className="text-muted-foreground mb-3">{currentMatch.bio || currentMatch.tagline}</p>
                  
                  <div className="flex items-center text-sm mb-2">
                    <div className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground mr-2">
                      {currentMatch.industry}
                    </div>
                    {currentMatch.raised_amount && currentMatch.raised_amount !== "N/A" && (
                      <div className="text-muted-foreground">
                        Raised: {currentMatch.raised_amount}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2 mb-4">
                  <Button 
                    variant="secondary"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleIgnoreStartup(currentMatch)}
                  >
                    <ThumbsDown size={16} className="mr-1" />
                    <span>Not Interested</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleViewChat(currentMatch.chatId!)}
                  >
                    <Eye size={16} className="mr-1" />
                    <span>View Conversation</span>
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="default"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleFollowStartup(currentMatch)}
                  >
                    <ThumbsUp size={16} className="mr-1" />
                    <span>Follow</span>
                  </Button>
                  <Button 
                    variant="accent"
                    className="flex-1 flex justify-center items-center"
                    onClick={() => handleRequestDemo(currentMatch)}
                  >
                    <MessageSquare size={16} className="mr-1" />
                    <span>Request Demo</span>
                  </Button>
                </div>
              </div>
              
              {/* Pagination Controls */}
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
      
      {/* AI Chat View */}
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
      
      {/* Confirmed Matches */}
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
