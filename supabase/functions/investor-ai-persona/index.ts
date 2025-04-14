
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      chatHistory, 
      investorId, 
      startupId, 
      investorPreferences, 
      investorName,
      startupInfo,
      chatId,
      personaSettings
    } = await req.json();

    console.log(`Processing message from startup ${startupId} to investor persona ${investorId}`);
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Construct system prompt based on investor preferences
    let systemPrompt = `You are an AI simulation of the investor ${investorName || "the investor"}. `;
    
    // Track which questions have been asked
    let requiredQuestions = [];
    let askedQuestions = new Set();
    
    // Extract questions from persona settings
    if (personaSettings && personaSettings.custom_questions) {
      requiredQuestions = personaSettings.custom_questions
        .filter(q => q.enabled !== false)
        .map((q, idx) => ({
          id: q.id || `custom-${idx}`,
          question: q.question,
          asked: false
        }));
    }
    
    // Check chat history to see which questions have been asked
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        if (msg.sender_type === "ai") {
          requiredQuestions.forEach(q => {
            // Check if the question has been substantially asked
            if (msg.content.toLowerCase().includes(q.question.toLowerCase().substring(0, Math.min(30, q.question.length)))) {
              q.asked = true;
            }
          });
        }
      });
    }
    
    // Determine the next question to ask
    const nextQuestionToAsk = requiredQuestions.find(q => !q.asked);
    
    // Update system prompt to focus on asking the next unasked question
    if (nextQuestionToAsk) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST ask the following specific question EXACTLY as written. Do not modify or rephrase the question:\n"${nextQuestionToAsk.question}"\n`;
      systemPrompt += `\nYour ONLY task is to ask this specific question. Do not create additional context or follow-ups.`;
    } else {
      // If all questions have been asked, allow a summary
      systemPrompt += `\nAll required questions have been asked. You may now provide a brief summary of the conversation.`;
    }
    
    // Prepare messages for OpenAI API
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add previous messages
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.sender_type === "startup" ? "user" : "assistant",
          content: msg.content
        });
      });
    }
    
    // Add current message
    messages.push({
      role: "user",
      content: message
    });
    
    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Determine if all questions have been asked
    const allQuestionsAsked = requiredQuestions.every(q => q.asked);
    
    // Calculate match score if all questions are asked and it's the last exchange
    let matchScore = null;
    let matchSummary = null;
    
    if (allQuestionsAsked && chatHistory && chatHistory.length >= 5) {
      const scoringPrompt = `
Based on the conversation between the startup and investor, evaluate how well the startup matches the investor's preferences.
Here is the investor's profile:
${JSON.stringify(investorPreferences || "General investor with no specific preferences")}

Here is the startup's information:
${JSON.stringify(startupInfo || "Information gathered only from conversation")}

Provide:
1. A match score from 0-100 where 100 is a perfect match
2. A 2-3 sentence summary of why the startup might be interesting to this investor
Output format: {"score": number, "summary": "text explanation"} - JSON format only`;

      const scoringResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an AI that evaluates startup-investor fit based on conversations. Output only JSON." },
            { role: "user", content: scoringPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (scoringResponse.ok) {
        const scoringData = await scoringResponse.json();
        try {
          const scoreContent = scoringData.choices[0].message.content;
          const jsonMatch = scoreContent.match(/\{.*\}/s);
          
          if (jsonMatch) {
            const scoreObject = JSON.parse(jsonMatch[0]);
            matchScore = scoreObject.score;
            matchSummary = scoreObject.summary;
          }
        } catch (error) {
          console.error("Error parsing match score:", error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        matchScore,
        matchSummary,
        chatId,
        isQuestionPending: !allQuestionsAsked,
        remainingQuestions: requiredQuestions.filter(q => !q.asked),
        askedQuestions: requiredQuestions.filter(q => q.asked).map(q => q.id)
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in investor-ai-persona function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
