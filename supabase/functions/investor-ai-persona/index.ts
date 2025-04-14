
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
    console.log(`Investor preferences:`, investorPreferences);
    console.log(`Persona settings:`, personaSettings);
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.");
    }
    
    // Construct system prompt based on investor preferences
    let systemPrompt = `You are an AI simulation of the investor ${investorName || "the investor"}. `;
    
    if (investorPreferences) {
      if (investorPreferences.preferred_sectors && investorPreferences.preferred_sectors.length > 0) {
        systemPrompt += `You focus on investing in the following sectors: ${investorPreferences.preferred_sectors.join(", ")}. `;
      }
      
      if (investorPreferences.preferred_stages && investorPreferences.preferred_stages.length > 0) {
        systemPrompt += `You typically invest in startups at these stages: ${investorPreferences.preferred_stages.join(", ")}. `;
      }
      
      if (investorPreferences.min_investment || investorPreferences.max_investment) {
        systemPrompt += `Your typical investment range is ${investorPreferences.min_investment || ""}${investorPreferences.min_investment && investorPreferences.max_investment ? ' to ' : ''}${investorPreferences.max_investment || ""}. `;
      }
    } else {
      systemPrompt += `As a general investor, you focus on the team, product-market fit, traction, and business model. `;
    }
    
    systemPrompt += `
You're conducting a simulated conversation with a startup to assess if they would be a good investment match.

About the startup:
${startupInfo ? JSON.stringify(startupInfo) : "You will learn about them during the conversation."}

Your conversation style:
1. Be concise but friendly and professional.
2. Ask exactly the questions provided in your list and don't make up your own questions.
3. You should be curious but also critical - investors need to assess risk.
4. Do not reveal that you are an AI simulation - act as if you are actually the investor.
5. Keep responses under 150 words.
6. Always end your messages with exactly one of the questions from your list that hasn't been asked yet.
7. Never suggest follow-up meetings or ask if the startup wants to continue the conversation outside of this chat.
8. Your job is to collect information, not to decide on investment - don't indicate investment decisions.

`;

    // Track which questions have been asked in the conversation
    const askedQuestions = new Set();
    if (chatHistory) {
      chatHistory.forEach(msg => {
        if (msg.sender_type === "ai") {
          // Look for questions in AI messages
          const text = msg.content.toLowerCase();
          
          // Check for standard questions
          if (text.includes("business model")) askedQuestions.add("business_model");
          if (text.includes("traction")) askedQuestions.add("traction");
          if (text.includes("competitor") || text.includes("differentiate")) askedQuestions.add("competitors");
          if (text.includes("go-to-market") || text.includes("go to market")) askedQuestions.add("gtm");
          if (text.includes("team")) askedQuestions.add("team");
          
          // Check for custom questions if they exist
          if (personaSettings && personaSettings.custom_questions) {
            personaSettings.custom_questions
              .filter(q => q.enabled !== false)
              .forEach(q => {
                // Check if this question or something similar was asked
                if (text.includes(q.question.toLowerCase().substring(0, 15))) {
                  askedQuestions.add(q.id);
                }
              });
          }
        }
      });
    }
    
    // Add custom questions from persona settings if they exist
    let questionsToAsk = [];
    
    if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
      systemPrompt += `\nIMPORTANT: You MUST ask these specific questions exactly as written during the conversation (one at a time):`;
      
      const customQuestions = personaSettings.custom_questions
        .filter(q => q.enabled !== false);
        
      customQuestions.forEach(q => {
        systemPrompt += `\n- ${q.question}`;
        if (!askedQuestions.has(q.id)) {
          questionsToAsk.push(q.question);
        }
      });
      
      systemPrompt += `\n`;
    } else {
      systemPrompt += `\nIMPORTANT: You MUST ask these specific questions exactly as written during the conversation (one at a time):`;
      const standardQuestions = [
        "Tell me about your business model?",
        "What traction do you have so far?",
        "Who are your competitors and how do you differentiate?",
        "What's your go-to-market strategy?",
        "Tell me about your team background?"
      ];
      
      standardQuestions.forEach((q, i) => {
        systemPrompt += `\n- ${q}`;
        const key = ["business_model", "traction", "competitors", "gtm", "team"][i];
        if (!askedQuestions.has(key)) {
          questionsToAsk.push(q);
        }
      });
      
      systemPrompt += `\n`;
    }
    
    // If we have questions to ask and this isn't the first few messages,
    // explicitly instruct the AI to ask one of them
    if (questionsToAsk.length > 0) {
      // Calculate how many messages are left in a typical conversation
      const messagesLeft = Math.max(10 - (chatHistory?.length || 0), 2);
      
      // If we're nearing the end of the conversation or have a large number of questions left
      if (messagesLeft <= questionsToAsk.length + 1 || questionsToAsk.length > 2) {
        const nextQuestion = questionsToAsk[0];
        systemPrompt += `\nIMPORTANT: You MUST ask "${nextQuestion}" in your next response, word for word. This is crucial information you need before making an investment decision.`;
      } else {
        systemPrompt += `\nIMPORTANT: You still need to ask about these topics before the conversation ends: ${questionsToAsk.join(", ")}. Ask one of these EXACT questions in your next response.`;
      }
    } else if (chatHistory && chatHistory.length >= 8) {
      // If we've asked all questions and have had enough exchanges, we can wrap up
      systemPrompt += `\nYou have asked all the required questions. In your next response, thank them for their time and avoid asking new questions or suggesting follow-up meetings.`;
    }
    
    // Add any additional custom system prompt from settings
    if (personaSettings && personaSettings.system_prompt) {
      systemPrompt += `\nAdditional instructions for you (but remember to prioritize asking the specific questions above): ${personaSettings.system_prompt}\n`;
    }
    
    systemPrompt += `\nYour goal is to collect information by asking exactly the questions provided, not to make investment decisions or schedule follow-ups.`;

    // Prepare the conversation history for the API call
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add previous messages if they exist
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        messages.push({
          role: msg.sender_type === "startup" ? "user" : "assistant",
          content: msg.content
        });
      });
    }
    
    // Add the current message
    messages.push({
      role: "user",
      content: message
    });
    
    console.log("Sending to OpenAI with messages:", messages.length);
    
    // Get response from OpenAI
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
    
    // Check if the AI response ends with a question
    // If it does, we don't want to mark the chat as complete
    const endsWithQuestion = aiResponse.trim().endsWith('?');
    
    // Also check if all questions have been asked
    const allQuestionsAsked = questionsToAsk.length === 0;
    
    // Calculate match score if we have enough context and all questions have been asked
    let matchScore = null;
    let matchSummary = null;
    
    // If we have enough messages (at least 3 exchanges) and all questions asked, we can calculate a match score
    if (chatHistory && chatHistory.length >= 5 && allQuestionsAsked && !endsWithQuestion) {
      console.log("Generating match score and summary based on conversation");
      
      const scoringPrompt = `
Based on the conversation between the startup and investor, evaluate how well the startup matches the investor's preferences.
Here is the investor's profile:
${JSON.stringify(investorPreferences || "General investor with no specific preferences")}

Here is the startup's information:
${JSON.stringify(startupInfo || "Information gathered only from conversation")}

Based on this conversation:
${JSON.stringify(chatHistory)}
${JSON.stringify({ sender_type: "startup", content: message })}
${JSON.stringify({ sender_type: "ai", content: aiResponse })}

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
          // Extract JSON from the response - it might be embedded in text
          const scoreContent = scoringData.choices[0].message.content;
          const jsonMatch = scoreContent.match(/\{.*\}/s);
          
          if (jsonMatch) {
            const scoreObject = JSON.parse(jsonMatch[0]);
            matchScore = scoreObject.score;
            matchSummary = scoreObject.summary;
            console.log(`Generated match score: ${matchScore} and summary: ${matchSummary}`);
          }
        } catch (error) {
          console.error("Error parsing match score:", error);
          console.log("Raw scoring response:", scoringData.choices[0].message.content);
        }
      } else {
        console.error("Error generating match score:", await scoringResponse.text());
      }
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        matchScore,
        matchSummary,
        chatId,
        isQuestionPending: endsWithQuestion || !allQuestionsAsked,
        remainingQuestions: questionsToAsk
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
