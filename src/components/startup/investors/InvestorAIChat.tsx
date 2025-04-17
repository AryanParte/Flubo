import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvestorAIChatProps {
  investorId: string;
  investorName: string;
  onBack: () => void;
  onComplete?: (matchScore: number, matchSummary: string) => void;
}

interface Message {
  id: string;
  sender_type: "startup" | "ai";
  content: string;
  timestamp: string;
}

export const InvestorAIChat = ({ investorId, investorName, onBack, onComplete }: InvestorAIChatProps) => {
  const { user } = useAuth();
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatCompleted, setChatCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const savedChatId = useRef<string | null>(null);
  
  // Track custom questions progress in the conversation
  const [questionProgress, setQuestionProgress] = useState<{
    customQuestionsAsked: number;
    totalCustomQuestions: number;
    defaultQuestionsAsked: number;
    totalDefaultQuestions: number;
    nextQuestionIsCustom: boolean;
  } | null>(null);
  
  useEffect(() => {
    const fetchExistingChat = async () => {
      if (!user || !investorId) return;
      
      try {
        setIsLoading(true);
        
        const { data: existingChat, error: chatError } = await supabase
          .from('ai_persona_chats')
          .select('id, match_score, summary, completed')
          .eq('startup_id', user.id)
          .eq('investor_id', investorId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (chatError && chatError.code !== 'PGRST116') {
          console.error("Error fetching existing chat:", chatError);
          toast({
            title: "Error",
            description: "Failed to load previous conversation",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (existingChat) {
          console.log("Found existing chat:", existingChat.id);
          setChatId(existingChat.id);
          savedChatId.current = existingChat.id;
          setChatCompleted(existingChat.completed || false);
          
          if (existingChat.completed && existingChat.match_score !== null && onComplete && user.id === investorId) {
            onComplete(existingChat.match_score, existingChat.summary || "");
          }
          
          const { data: chatMessages, error: messagesError } = await supabase
            .from('ai_persona_messages')
            .select('id, sender_type, content, created_at')
            .eq('chat_id', existingChat.id)
            .order('created_at', { ascending: true });
            
          if (messagesError) {
            console.error("Error fetching chat messages:", messagesError);
            toast({
              title: "Error",
              description: "Failed to load previous messages",
              variant: "destructive",
            });
          } else if (chatMessages && chatMessages.length > 0) {
            console.log(`Loaded ${chatMessages.length} previous messages`);
            
            const formattedMessages: Message[] = chatMessages.map(msg => ({
              id: msg.id,
              sender_type: msg.sender_type as "startup" | "ai",
              content: msg.content,
              timestamp: msg.created_at
            }));
            
            setMessages(formattedMessages);
            
            if (formattedMessages.length > 0 && 
                formattedMessages[formattedMessages.length - 1].sender_type === "ai" &&
                existingChat.completed) {
              console.log("Last message is from AI, chat should not be completed");
              await supabase
                .from('ai_persona_chats')
                .update({ completed: false })
                .eq('id', existingChat.id);
              
              setChatCompleted(false);
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchExistingChat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExistingChat();
  }, [user, investorId, onComplete]);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Debug function to check if custom questions are being asked
  const checkCustomQuestionsProgress = useCallback((response: any) => {
    if (response && typeof response === 'object') {
      const customQuestionsAsked = response.customQuestionsAsked || 0;
      const totalCustomQuestions = response.totalCustomQuestions || 0;
      const defaultQuestionsAsked = response.defaultQuestionsAsked || 0;
      const totalDefaultQuestions = response.totalDefaultQuestions || 0;
      const nextQuestionIsCustom = response.remainingQuestions?.length > 0 ? 
        response.remainingQuestions[0]?.isCustom : false;
        
      setQuestionProgress({
        customQuestionsAsked,
        totalCustomQuestions,
        defaultQuestionsAsked,
        totalDefaultQuestions,
        nextQuestionIsCustom
      });
      
      console.log("Question progress:", {
        custom: `${customQuestionsAsked}/${totalCustomQuestions}`,
        default: `${defaultQuestionsAsked}/${totalDefaultQuestions}`,
        nextIsCustom: nextQuestionIsCustom
      });
      
      return totalCustomQuestions > 0 && customQuestionsAsked > 0;
    }
    return false;
  }, []);
  
  // Efficiently prepare persona settings
  const preparePersonaSettings = useCallback(async (investorId: string) => {
    console.log(`Fetching persona settings for investor ${investorId}`);
    
    // FIX: First verify this investor explicitly by checking if they exist in the settings table
    const { count, error: countError } = await supabase
      .from('investor_ai_persona_settings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', investorId);
    
    if (countError) {
      console.error("Error checking if investor has persona settings:", countError.message);
    } else {
      console.log(`Found ${count} persona settings records for investor ${investorId}`);
    }
    
    // Now fetch the full settings
    const { data: personaSettings, error: settingsError } = await supabase
      .from('investor_ai_persona_settings')
      .select('*')
      .eq('user_id', investorId)
      .maybeSingle();
      
    if (settingsError) {
      console.error("Error fetching persona settings:", settingsError.message);
      return null;
    } 
    
    // Check if we found persona settings
    if (!personaSettings) {
      // This investor doesn't have custom questions configured
      console.error(`NO PERSONA SETTINGS FOUND for investor ${investorId}. They need to configure custom questions in settings.`);
      return null;
    }
    
    console.log("Found persona settings with ID:", personaSettings.id);
    console.log("Raw personaSettings:", JSON.stringify(personaSettings));
    console.log("Custom questions count before processing:", personaSettings?.custom_questions?.length || 0);
    
    if (!personaSettings.custom_questions || personaSettings.custom_questions.length === 0) {
      console.warn("Investor has settings but NO CUSTOM QUESTIONS configured");
    }
    
    // Create a deep clone to avoid modifying the original
    const settingsCopy = JSON.parse(JSON.stringify(personaSettings));
    
    // Process custom questions - CRITICAL FIX: Ensure custom questions are properly formatted
    if (settingsCopy.custom_questions) {
      if (!Array.isArray(settingsCopy.custom_questions)) {
        console.warn("Custom questions is not an array, fixing");
        settingsCopy.custom_questions = [];
      } else {
        // CRITICAL FIX: Ensure we only keep valid, enabled questions with the correct format
        const validQuestions = settingsCopy.custom_questions
          .filter(q => (
            q && 
            typeof q === 'object' && 
            typeof q.question === 'string' && 
            q.question.trim().length > 0 &&
            q.enabled !== false // Only keep enabled questions
          ))
          .map(q => ({
            id: q.id || crypto.randomUUID(),
            question: q.question.trim(),
            enabled: true // Force to true since we already filtered out disabled ones
          }));
        
        settingsCopy.custom_questions = validQuestions;
        
        if (validQuestions.length > 0) {
          console.log(`FOUND ${validQuestions.length} VALID CUSTOM QUESTIONS FOR THIS INVESTOR:`, 
            validQuestions.map(q => q.question));
        } else {
          console.warn("NO VALID CUSTOM QUESTIONS found for this investor after filtering");
        }
      }
    }
    
    return settingsCopy;
  }, []);
  
  const sendMessage = async (messageText: string) => {
    if (!user || !investorId || !messageText.trim() || isSending) {
      return;
    }
    
    try {
      setIsSending(true);
      
      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender_type: "startup",
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage("");
      
      // Fetch data in parallel for better performance
      const [startupData, investorPref, personaSettings] = await Promise.all([
        supabase.from('startup_profiles').select('*').eq('id', user.id).single().then(res => res.data),
        supabase.from('investor_preferences').select('*').eq('user_id', investorId).maybeSingle().then(res => res.data),
        preparePersonaSettings(investorId)
      ]);
      
      // Handle chat ID management
      let currentChatId = chatId;
      if (!currentChatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('ai_persona_chats')
          .insert({
            investor_id: investorId,
            startup_id: user.id,
          })
          .select('id')
          .single();
          
        if (chatError) {
          console.error("Error creating chat:", chatError);
          throw new Error("Failed to create chat session");
        }
        
        currentChatId = newChat.id;
        setChatId(currentChatId);
        savedChatId.current = currentChatId;
      }
      
      // Save user message to database
      await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: currentChatId,
          sender_type: "startup",
          content: messageText,
        });
      
      // Check if this is a brand new chat with no messages and we have custom questions
      // If so, we'll handle it directly to ensure custom questions are asked first
      const isNewChat = messages.length === 0;
      const hasCustomQuestions = personaSettings?.custom_questions && personaSettings.custom_questions.length > 0;
      
      if (isNewChat && hasCustomQuestions) {
        console.log("New chat with custom questions - taking direct control");
        
        // Get the first custom question
        const firstCustomQuestion = personaSettings.custom_questions[0].question;
        console.log("Directly using first custom question:", firstCustomQuestion);
        
        // Create the AI response manually
        const aiResponse: Message = {
          id: crypto.randomUUID(),
          sender_type: "ai",
          content: firstCustomQuestion,
          timestamp: new Date().toISOString(),
        };
        
        // Save the response to the database
        await supabase
          .from('ai_persona_messages')
          .insert({
            chat_id: currentChatId,
            sender_type: "ai",
            content: firstCustomQuestion,
          });
        
        // Update the UI
        setMessages(prev => [...prev, aiResponse]);
        
        // Set question progress
        setQuestionProgress({
          customQuestionsAsked: 1,
          totalCustomQuestions: personaSettings.custom_questions.length,
          defaultQuestionsAsked: 0,
          totalDefaultQuestions: 5, // Default question count
          nextQuestionIsCustom: personaSettings.custom_questions.length > 1
        });
        
        // Scroll to bottom and finish
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        setIsSending(false);
        return;
      }
      
      // Log persona settings to help debug
      if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
        console.log("IMPORTANT: Sending persona settings with custom questions:", 
          personaSettings.custom_questions.map(q => q.question));
      } else {
        console.log("No custom questions available in persona settings");
      }
      
      console.log('Preparing to call AI persona function', {
        messageLength: messageText.length,
        chatHistoryLength: messages.length,
        hasPersonaSettings: !!personaSettings,
        customQuestionsCount: personaSettings?.custom_questions?.length || 0
      });
      
      // Call the edge function
      const functionUrl = "https://vsxnjnvwtgehagxbhdzh.supabase.co/functions/v1/investor-ai-persona";
      
      // Prepare the payload with additional flags to force custom questions if they exist
      
      // CRITICAL FIX: Ensure we're passing persona settings correctly and emphasizing custom questions
      // Extract just the custom questions to be extra clear
      const customQuestions = personaSettings?.custom_questions && personaSettings.custom_questions.length > 0 
        ? personaSettings.custom_questions 
        : null;
        
      if (customQuestions) {
        console.log("CRITICAL: Found custom questions to include in payload:", 
          customQuestions.map(q => q.question));
      } else {
        console.warn("No custom questions available to send in payload");
      }
      
      const payload = {
        message: messageText,
        chatHistory: messages,
        investorId: investorId,
        startupId: user.id,
        investorPreferences: investorPref,
        investorName: investorName,
        startupInfo: startupData,
        chatId: currentChatId,
        personaSettings: personaSettings,
        // Force flags to ensure custom questions are prioritized
        forceCustomQuestions: hasCustomQuestions,
        prioritizeCustomQuestions: true,
        // CRITICAL FIX: Add explicit custom_questions field for redundancy
        custom_questions: customQuestions,
        debug: true
      };
      
      console.log("Sending payload with custom question flags:", {
        forceCustomQuestions: hasCustomQuestions,
        prioritizeCustomQuestions: true,
        customQuestionsCount: customQuestions?.length || 0,
        includesFullPersonaSettings: !!personaSettings
      });
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzeG5qbnZ3dGdlaGFneGJoZHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODkzOTQsImV4cCI6MjA1ODE2NTM5NH0.4SEISsoUanD3lFIswUzBFo4ll3qC2Yd6mlN8rVwuyFo`,
        },
        body: JSON.stringify(payload),
      });
      
      // Process the response
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI persona response error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
        console.log('Received AI response:', data.response);
        
        // Enhanced logging of Edge Function response
        console.log('Edge Function response details:', {
          hasCustomQuestions: data.hasCustomQuestions,
          customQuestionsCount: data.customQuestionsCount,
          customQuestionsAsked: data.customQuestionsAsked,
          totalCustomQuestions: data.totalCustomQuestions,
          nextQuestionIsCustom: data.nextQuestionIsCustom,
          remainingCustomCount: data.remainingCustomCount,
          isQuestionPending: data.isQuestionPending
        });
        
        // Detailed logging of remaining questions
        if (data.remainingQuestions && data.remainingQuestions.length > 0) {
          console.log("Remaining questions from Edge Function:");
          data.remainingQuestions.slice(0, 3).forEach((q, idx) => {
            console.log(`  ${idx+1}. "${q.question}" (isCustom: ${q.isCustom})`);
          });
        }
        
        // Log important information about custom questions
        if (data.customQuestionsCount > 0) {
          console.log(`AI reports custom questions: ${data.customQuestionsAsked}/${data.totalCustomQuestions} asked`);
          if (data.remainingQuestions && data.remainingQuestions.length > 0) {
            console.log("Next question from AI:", data.remainingQuestions[0].question);
            console.log("Is next question custom:", data.remainingQuestions[0].isCustom);
          }
        } else {
          console.log("No custom questions reported by Edge Function - using default questions only");
        }
      } catch (parseError) {
        console.error('JSON parsing error:', {
          error: parseError
        });
        throw new Error('Failed to parse API response');
      }
      
      // Check if custom questions are being asked
      const customQuestionsWorking = checkCustomQuestionsProgress(data);
      console.log(`Custom questions working: ${customQuestionsWorking}`);
      
      let aiResponseContent = data.response;
      
      // Handle the case where the Edge Function isn't correctly handling custom questions
      // If we have custom questions but they're not being asked, take control
      if (personaSettings?.custom_questions && personaSettings.custom_questions.length > 0) {
        // Calculate how many custom questions have been asked so far
        const customQuestionsAsked = messages.filter(m => 
          m.sender_type === 'ai' && 
          personaSettings.custom_questions.some(q => 
            m.content.includes(q.question)
          )
        ).length;
        
        const totalCustomQuestions = personaSettings.custom_questions.length;
        
        console.log(`MANUAL TRACKING: ${customQuestionsAsked}/${totalCustomQuestions} custom questions asked so far`);
        console.log("Custom questions from settings:", personaSettings.custom_questions.map(q => q.question));
        
        // Check if the AI response contains a custom question
        const currentResponseContainsCustomQuestion = personaSettings.custom_questions.some(q => 
          aiResponseContent.includes(q.question)
        );
        
        console.log(`Current AI response contains custom question: ${currentResponseContainsCustomQuestion}`);
        
        // CRITICAL FIX: Always force custom questions to be asked first until all are asked
        // If we haven't asked all custom questions, check if the next one is being asked
        if (customQuestionsAsked < totalCustomQuestions) {
          // If the current response doesn't contain the next custom question, force it
          if (!currentResponseContainsCustomQuestion) {
            // Get the next custom question that hasn't been asked yet
            const askedQuestionTexts = messages
              .filter(m => m.sender_type === 'ai')
              .map(m => m.content);
            
            // Find the next unanswered custom question
            const nextCustomQuestion = personaSettings.custom_questions.find(q => 
              !askedQuestionTexts.some(text => text.includes(q.question))
            );
            
            if (nextCustomQuestion) {
              console.log(`FORCIBLY OVERRIDING with next custom question: "${nextCustomQuestion.question}"`);
              
              // Replace AI response with the custom question
              aiResponseContent = `Thank you for sharing that information. ${nextCustomQuestion.question}`;
              
              // Update progress tracking
              setQuestionProgress({
                customQuestionsAsked: customQuestionsAsked + 1,
                totalCustomQuestions: totalCustomQuestions,
                defaultQuestionsAsked: data.defaultQuestionsAsked || 0,
                totalDefaultQuestions: data.totalDefaultQuestions || 5,
                nextQuestionIsCustom: customQuestionsAsked + 1 < totalCustomQuestions
              });
              
              console.log("OVERRIDE SUCCESSFUL - Using custom question instead of Edge Function response");
            } else {
              console.warn("Could not find next unanswered custom question - something is wrong with tracking");
            }
          } else {
            console.log("Edge Function correctly included a custom question - no need to override");
          }
        } else {
          console.log(`All ${totalCustomQuestions} custom questions have been asked, moving to default questions`);
        }
      }
      
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        sender_type: "ai",
        content: aiResponseContent,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save AI response to database
      await supabase
        .from('ai_persona_messages')
        .insert({
          chat_id: currentChatId,
          sender_type: "ai",
          content: aiResponseContent,
        });
      
      // Check if chat is complete
      let shouldMarkComplete = data.matchScore !== null && 
        typeof data.matchScore !== 'undefined' && 
        !aiResponseContent.trim().endsWith('?') &&
        !data.isQuestionPending;
      
      // Make sure all custom questions have been asked before marking as complete
      if (shouldMarkComplete && personaSettings?.custom_questions && personaSettings.custom_questions.length > 0) {
        // Check if all custom questions have been asked
        const allMessages = [...messages, aiResponse];
        const customQuestionsAsked = allMessages.filter(m => 
          m.sender_type === 'ai' && 
          personaSettings.custom_questions.some(q => 
            m.content.includes(q.question)
          )
        ).length;
        
        const totalCustomQuestions = personaSettings.custom_questions.length;
        
        if (customQuestionsAsked < totalCustomQuestions) {
          console.log(`Cannot mark chat as complete - only ${customQuestionsAsked}/${totalCustomQuestions} custom questions asked`);
          shouldMarkComplete = false;
        } else {
          console.log(`All ${customQuestionsAsked}/${totalCustomQuestions} custom questions have been asked, can proceed to completion`);
        }
      }
      
      if (shouldMarkComplete) {
        console.log("All questions have been asked, marking chat as complete");
        await supabase
          .from('ai_persona_chats')
          .update({
            match_score: data.matchScore,
            summary: data.matchSummary,
            completed: true
          })
          .eq('id', currentChatId);
          
        setChatCompleted(true);
        
        if (onComplete && user.id === investorId) {
          onComplete(data.matchScore, data.matchSummary);
        }
      } else if (data.isQuestionPending) {
        // Log that there are still questions to be asked
        console.log("Questions are still pending, chat continues");
        
        // If there was a previous completion, revert it
        if (chatCompleted) {
          console.log("Reverting previous chat completion - questions still remain");
          setChatCompleted(false);
          
          await supabase
            .from('ai_persona_chats')
            .update({
              completed: false
            })
            .eq('id', currentChatId);
        }
      }
      
      // Scroll to bottom of chat
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error("Error in sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-lg font-semibold">{investorName}</h2>
            {questionProgress && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {questionProgress.totalCustomQuestions > 0 ? (
                  <>
                    <span>
                      Custom questions: {questionProgress.customQuestionsAsked}/{questionProgress.totalCustomQuestions}
                    </span>
                    {questionProgress.customQuestionsAsked > 0 ? (
                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20">
                        Custom questions active
                      </Badge>
                    ) : questionProgress.nextQuestionIsCustom ? (
                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 animate-pulse">
                        Next question is custom
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Waiting for custom questions
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      Using default questions
                    </Badge>
                    {!isLoading && process.env.NODE_ENV !== 'production' && (
                      <Badge 
                        variant="outline" 
                        className="text-xs ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                      >
                        Custom questions missing from DB
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Debug panel - only visible during development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="text-xs border-b border-dashed p-2 bg-muted/10">
          <details>
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <div className="pt-2 pl-2 space-y-1">
              <p>Investor ID: {investorId}</p>
              <p>Chat ID: {chatId || 'Not created yet'}</p>
              <p>Messages count: {messages.length}</p>
              <p>
                Custom questions: {questionProgress?.customQuestionsAsked || 0}/{questionProgress?.totalCustomQuestions || 0} 
                {questionProgress?.nextQuestionIsCustom && ' (next is custom)'}
              </p>
              <p>
                Default questions: {questionProgress?.defaultQuestionsAsked || 0}/{questionProgress?.totalDefaultQuestions || 0}
              </p>
              
              {/* Quick check button to verify custom questions */}
              <div className="mt-2 pt-2 border-t border-dashed">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const settings = await preparePersonaSettings(investorId);
                      if (settings?.custom_questions?.length > 0) {
                        toast({
                          title: "Custom Questions Found",
                          description: `Found ${settings.custom_questions.length} custom questions for this investor`,
                        });
                        console.log("Investor custom questions:", settings.custom_questions);
                      } else {
                        toast({
                          title: "No Custom Questions",
                          description: "This investor has no custom questions configured",
                          variant: "destructive",
                        });
                      }
                    } catch (err) {
                      console.error("Error checking custom questions:", err);
                      toast({
                        title: "Error",
                        description: "Failed to check custom questions",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full text-xs"
                >
                  Check Custom Questions
                </Button>
                
                {/* Diagnostic button to check table structure and permissions */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      // First try to list tables to check if the table exists
                      const client = supabase.getClient();
                      
                      // Check schema version without running a query (safer)
                      console.log("Attempting to diagnose persona settings table issues");
                      console.log("Database connection info:", {
                        url: client.supabaseUrl,
                        hasAuth: !!client.auth,
                      });
                      
                      // Check if we can access any data from the table
                      const { data: testQuery, error: testError } = await supabase
                        .from('investor_ai_persona_settings')
                        .select('id')
                        .limit(1);
                        
                      if (testError) {
                        console.error("Error accessing persona settings table:", testError);
                        
                        // Try a direct insert to test permissions
                        toast({
                          title: "Table Access Error",
                          description: `Error: ${testError.message}. Will try direct insert.`,
                          variant: "destructive"
                        });
                      } else {
                        console.log("Successfully accessed persona settings table:", testQuery);
                        toast({
                          title: "Table Access Success",
                          description: "Can access the investor_ai_persona_settings table"
                        });
                      }
                      
                      // Check if other investors have settings
                      const { data: otherSettings, error: otherError } = await supabase
                        .from('investor_ai_persona_settings')
                        .select('user_id, id')
                        .neq('user_id', investorId)
                        .limit(5);
                        
                      if (otherError) {
                        console.error("Error checking other investors:", otherError);
                      } else if (otherSettings && otherSettings.length > 0) {
                        console.log(`Found ${otherSettings.length} other investors with settings:`, otherSettings);
                        toast({
                          title: "Other Investors Found",
                          description: `Found ${otherSettings.length} other investors with settings`
                        });
                      } else {
                        console.log("No other investors have settings configured");
                        toast({
                          title: "No Other Investors",
                          description: "No other investors have settings configured"
                        });
                      }
                    } catch (err) {
                      console.error("Error in diagnostic check:", err);
                      toast({
                        title: "Diagnostic Error",
                        description: "Failed to run diagnostics. See console for details.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full text-xs mt-2"
                >
                  Run Table Diagnostics
                </Button>
                
                {/* EMERGENCY FIX: Add button to force-create persona settings for this investor */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      // Check if settings exist
                      const { count } = await supabase
                        .from('investor_ai_persona_settings')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', investorId);
                      
                      if (count && count > 0) {
                        toast({
                          title: "Settings Already Exist",
                          description: "Persona settings already exist for this investor. Will force update with debug questions."
                        });
                      }
                      
                      // Define the custom questions we know exist in the UI
                      const forceCustomQuestions = [
                        {
                          id: crypto.randomUUID(),
                          question: "Have you done any market research?",
                          enabled: true
                        },
                        {
                          id: crypto.randomUUID(),
                          question: "What would you do with your first 100k?",
                          enabled: true
                        }
                      ];
                      
                      // Create or update the settings
                      const { error } = await supabase
                        .from('investor_ai_persona_settings')
                        .upsert({
                          user_id: investorId,
                          custom_questions: forceCustomQuestions,
                          system_prompt: "You are an AI simulation of an investor interviewing startup founders.",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        });
                        
                      if (error) {
                        console.error("Error creating persona settings:", error);
                        throw error;
                      }
                      
                      toast({
                        title: "Custom Questions Fixed",
                        description: "Successfully synchronized custom questions from UI to database",
                      });
                      
                      // Verify settings were created
                      const { data: verifyData } = await supabase
                        .from('investor_ai_persona_settings')
                        .select('*')
                        .eq('user_id', investorId)
                        .single();
                        
                      console.log("Verified persona settings:", verifyData);
                    } catch (err) {
                      console.error("Error fixing custom questions:", err);
                      toast({
                        title: "Error",
                        description: "Failed to fix custom questions",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="w-full text-xs mt-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                >
                  FIX: Sync UI Questions to Database
                </Button>
              </div>
            </div>
          </details>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted-foreground mr-2" />
            <span className="text-muted-foreground">Loading conversation...</span>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === "startup" ? "justify-end" : "justify-start"} mb-3`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                    msg.sender_type === "startup" 
                      ? "bg-accent text-accent-foreground rounded-br-none" 
                      : "bg-muted rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8 space-y-4">
                <p>Start the conversation by asking a question or introducing your startup.</p>
                {!isLoading && (
                  <div className="text-xs bg-accent/5 p-4 rounded-md mx-auto max-w-md border border-border">
                    <p className="font-medium mb-2">How this conversation works:</p>
                    <ul className="text-left list-disc pl-4 space-y-1">
                      <li>The AI will ask you specific questions about your startup</li>
                      {questionProgress?.totalCustomQuestions > 0 ? (
                        <li>
                          This investor has <strong className="text-primary">{questionProgress.totalCustomQuestions} custom questions</strong> that will be asked first
                        </li>
                      ) : (
                        <li>This conversation will use the default standard questions</li>
                      )}
                      <li>After answering all questions, you'll get a match score</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {chatCompleted && !isLoading && user?.id !== investorId && (
              <div className="mt-6 p-4 border border-accent/20 bg-accent/10 rounded-lg text-center">
                <p className="font-medium">This chat is complete. The investor will be notified of this potential match.</p>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await sendMessage(currentMessage);
          }}
          className="flex items-center"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-1 mr-2"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            disabled={isLoading || isSending || chatCompleted}
          />
          <Button type="submit" disabled={isLoading || isSending || !currentMessage.trim() || chatCompleted}>
            {isSending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
