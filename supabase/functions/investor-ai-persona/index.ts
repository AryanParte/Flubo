
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
    console.log(`Persona settings received:`, personaSettings ? JSON.stringify(personaSettings, null, 2) : 'no');
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Extract questions from persona settings
    let requiredQuestions = [];
    let askedQuestions = new Set();
    
    // Get custom questions if available, otherwise use default questions
    if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
      console.log("Using custom questions:", personaSettings.custom_questions.length);
      console.log("Raw custom questions:", JSON.stringify(personaSettings.custom_questions, null, 2));
      
      // Log all custom questions for debugging
      personaSettings.custom_questions.forEach((q, idx) => {
        console.log(`Custom question ${idx}: "${q.question}" (enabled: ${q.enabled !== false}, id: ${q.id || 'none'})`);
      });
      
      // Only use the enabled custom questions
      requiredQuestions = personaSettings.custom_questions
        .filter(q => q.enabled !== false)
        .map((q, idx) => ({
          id: q.id || `custom-${idx}`,
          question: q.question,
          asked: false,
          isCustom: true
        }));
      
      console.log(`Found ${requiredQuestions.length} enabled custom questions to ask`);
    }
    
    // If no custom questions are set or all custom questions are disabled, use default questions
    if (requiredQuestions.length === 0) {
      console.log("No custom questions found, using default questions");
      const defaultQuestions = [
        "Tell me about your business model?",
        "What traction do you have so far?",
        "Who are your competitors and how do you differentiate?",
        "What's your go-to-market strategy?",
        "Tell me about your team background?"
      ];
      
      requiredQuestions = defaultQuestions.map((q, idx) => ({
        id: `default-${idx}`,
        question: q,
        asked: false,
        isCustom: false
      }));
    }
    
    // Check chat history to see which questions have been asked
    if (chatHistory && chatHistory.length > 0) {
      console.log(`Analyzing ${chatHistory.length} messages to determine asked questions`);
      
      for (const msg of chatHistory) {
        if (msg.sender_type === "ai") {
          for (const q of requiredQuestions) {
            if (q.asked) continue; // Skip already marked questions
            
            // Check if the question has been substantially asked
            // Make sure we're matching a significant portion of the question
            const questionLower = q.question.toLowerCase();
            const msgLower = msg.content.toLowerCase();
            
            // More precise matching to avoid partial matches
            // Use exact matching for custom questions to ensure we're asking precisely what was requested
            const isMatch = q.isCustom 
              ? msgLower.includes(questionLower) 
              : (msgLower.includes(questionLower) || 
                 msgLower.includes(questionLower.substring(0, Math.floor(questionLower.length * 0.75))));
            
            if (isMatch) {
              console.log(`Message matches question "${q.question}" - marking as asked`);
              q.asked = true;
              askedQuestions.add(q.id);
              break; // Move to next message after finding a match
            }
          }
        }
      }
      
      // Log current question status
      requiredQuestions.forEach(q => {
        console.log(`Question status: "${q.question}" - ${q.asked ? 'already asked' : 'not asked yet'}`);
      });
    }
    
    // Determine the next question to ask - strictly use the first unanswered custom question,
    // or if all custom questions are answered, move to default questions
    const nextCustomQuestion = requiredQuestions.find(q => !q.asked && q.isCustom);
    const nextDefaultQuestion = requiredQuestions.find(q => !q.asked && !q.isCustom);
    const nextQuestionToAsk = nextCustomQuestion || nextDefaultQuestion;
    
    if (nextQuestionToAsk) {
      console.log(`Next question to ask: "${nextQuestionToAsk.question}" (isCustom: ${nextQuestionToAsk.isCustom})`);
    } else {
      console.log("All questions have been asked");
    }
    
    // For empty or just starting conversations, immediately ask the first question
    // instead of a generic greeting
    if ((!chatHistory || chatHistory.length === 0) && nextQuestionToAsk) {
      console.log("New conversation - returning first question directly:", nextQuestionToAsk.question);
      // Return the first question directly without calling OpenAI
      return new Response(
        JSON.stringify({
          response: nextQuestionToAsk.question,
          matchScore: null,
          matchSummary: null,
          chatId,
          isQuestionPending: true,
          remainingQuestions: requiredQuestions.filter(q => !q.asked && q.id !== nextQuestionToAsk.id),
          askedQuestions: [nextQuestionToAsk.id]
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Construct system prompt based on investor preferences and next question
    let systemPrompt = `You are an AI simulation of the investor ${investorName || "the investor"}. `;
    
    // Add custom system prompt from persona settings if available
    if (personaSettings && personaSettings.system_prompt) {
      systemPrompt += `\n\n${personaSettings.system_prompt}\n\n`;
    }
    
    // Update system prompt to focus on asking the next unasked question
    if (nextQuestionToAsk) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST ask the following specific question EXACTLY as written. Do not modify or rephrase the question:\n"${nextQuestionToAsk.question}"\n`;
      systemPrompt += `\nYour ONLY task is to ask this specific question. Do not create additional context or follow-ups.`;
      systemPrompt += `\nDo not ask how you can help. Do not introduce yourself. Do not give a generic greeting. Just ask the question directly.`;
    } else {
      // If all questions have been asked, allow a summary
      systemPrompt += `\nAll required questions have been asked. You may now provide a brief summary of the conversation.`;
    }
    
    console.log("Using system prompt:", systemPrompt);
    
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
    console.log(`Calling OpenAI API with ${messages.length} messages`);
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
    let aiResponse = data.choices[0].message.content;
    console.log("AI response:", aiResponse);
    
    // If this is a follow-up response and there's a next question to ask,
    // ensure it's asking exactly the question we want
    if (chatHistory && chatHistory.length > 0 && nextQuestionToAsk) {
      // If the AI didn't actually ask the question properly, force it
      if (!aiResponse.includes(nextQuestionToAsk.question)) {
        console.log("AI didn't ask the exact question, forcing it");
        aiResponse = nextQuestionToAsk.question;
      }
    }
    
    // Mark the next question as asked if we're returning it
    if (nextQuestionToAsk) {
      nextQuestionToAsk.asked = true;
      askedQuestions.add(nextQuestionToAsk.id);
    }
    
    // Determine if all questions have been asked
    const allQuestionsAsked = requiredQuestions.every(q => q.asked);
    
    // Calculate match score if all questions are asked and it's the last exchange
    let matchScore = null;
    let matchSummary = null;
    
    if (allQuestionsAsked && chatHistory && chatHistory.length >= requiredQuestions.length) {
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

    console.log(`Returning response. Questions remaining: ${requiredQuestions.filter(q => !q.asked).length}`);
    console.log(`Asked questions IDs: ${Array.from(askedQuestions).join(', ')}`);
    
    return new Response(
      JSON.stringify({
        response: aiResponse,
        matchScore,
        matchSummary,
        chatId,
        isQuestionPending: !allQuestionsAsked,
        remainingQuestions: requiredQuestions.filter(q => !q.asked),
        askedQuestions: Array.from(askedQuestions)
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
