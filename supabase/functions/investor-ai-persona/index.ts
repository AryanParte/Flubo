
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
2. Ask pointed questions about their business model, traction, team, and how they fit with your investment focus.
3. You should be curious but also critical - investors need to assess risk.
4. Do not reveal that you are an AI simulation - act as if you are actually the investor.
5. Keep responses under 150 words.
6. IMPORTANT: You must ask ALL the questions provided to you below during the conversation.
7. DO NOT end the conversation with "follow-up" suggestions - your job is to ask the investor's questions.
8. DO NOT wrap up the conversation until you have asked all the required questions.
`;

    // Track which questions have been asked
    let requiredQuestions = [];
    let askedQuestions = new Set();
    
    // Extract questions from chat history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        if (msg.sender_type === "ai") {
          const content = msg.content.toLowerCase();
          // Check each required question to see if it's been asked
          requiredQuestions.forEach(q => {
            if (content.includes(q.question.toLowerCase().substring(0, 30))) {
              askedQuestions.add(q.id);
            }
          });
        }
      });
    }

    // Add custom questions from persona settings if they exist
    if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
      systemPrompt += `\nHere are specific questions you MUST ask during the conversation (don't ask them all at once):`;
      
      requiredQuestions = personaSettings.custom_questions
        .filter(q => q.enabled !== false)
        .map((q, idx) => ({
          id: q.id || `question-${idx}`,
          question: q.question
        }));
      
      requiredQuestions.forEach(q => {
        const isAsked = askedQuestions.has(q.id);
        systemPrompt += `\n- ${q.question} ${isAsked ? "(ALREADY ASKED)" : "(NOT YET ASKED)"}`;
      });
      
      systemPrompt += `\n`;
    } else {
      systemPrompt += `\nHere are questions you MUST ask during the conversation (don't ask them all at once):`;
      
      const defaultQuestions = [
        "Tell me about your business model?",
        "What traction do you have so far?",
        "Who are your competitors and how do you differentiate?",
        "What's your go-to-market strategy?",
        "Tell me about your team background?"
      ];
      
      requiredQuestions = defaultQuestions.map((q, idx) => ({
        id: `default-${idx}`,
        question: q
      }));
      
      requiredQuestions.forEach(q => {
        const isAsked = askedQuestions.has(q.id);
        systemPrompt += `\n- ${q.question} ${isAsked ? "(ALREADY ASKED)" : "(NOT YET ASKED)"}`;
      });
    }
    
    // Find questions that haven't been asked yet
    const remainingQuestions = requiredQuestions.filter(q => !askedQuestions.has(q.id));
    
    // Add a special instruction if there are remaining questions
    if (remainingQuestions.length > 0) {
      systemPrompt += `\n\nIMPORTANT INSTRUCTION: You still need to ask the following questions:`;
      remainingQuestions.forEach(q => {
        systemPrompt += `\n- ${q.question}`;
      });
      systemPrompt += `\n\nIn your next response, ask AT LEAST ONE of these remaining questions. DO NOT END THE CONVERSATION until you've asked all required questions.`;
    }
    
    // Add any additional custom system prompt from settings
    if (personaSettings && personaSettings.system_prompt) {
      systemPrompt += `\nAdditional instruction for you: ${personaSettings.system_prompt}\n`;
    }
    
    systemPrompt += `\nYour goal is to determine how well this startup aligns with your investment criteria and to gather enough information to make an initial assessment.`;

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
    
    // Determine if there are questions remaining to be asked
    // We'll check if this response might have asked one of the remaining questions
    let remainingQuestionsAfterResponse = [...remainingQuestions];
    remainingQuestions.forEach(q => {
      if (aiResponse.toLowerCase().includes(q.question.toLowerCase().substring(0, 30))) {
        // Remove this question from the remaining set
        remainingQuestionsAfterResponse = remainingQuestionsAfterResponse.filter(rq => rq.id !== q.id);
      }
    });
    
    // If there are still questions to ask, don't let the conversation end
    const hasRemainingQuestions = remainingQuestionsAfterResponse.length > 0;
    
    // Check if the AI response ends with a question or if there are remaining questions
    // If it does, we don't want to mark the chat as complete
    const endsWithQuestion = aiResponse.trim().endsWith('?') || hasRemainingQuestions;
    
    console.log(`Response has ${remainingQuestionsAfterResponse.length} remaining questions to ask`);
    console.log(`Is marked as question pending: ${endsWithQuestion}`);
    
    // Calculate match score if we have enough context and all questions have been asked
    let matchScore = null;
    let matchSummary = null;
    
    // If we have enough messages (at least 3 exchanges) and all questions have been asked, we can calculate a match score
    // But only if the AI response doesn't expect more information
    if (chatHistory && chatHistory.length >= 5 && !hasRemainingQuestions && !endsWithQuestion) {
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
        isQuestionPending: endsWithQuestion,
        remainingQuestions: remainingQuestionsAfterResponse
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
