
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
    
    // Define important topics to cover
    const topicCategories = {
      business_model: {
        covered: false,
        priority: 1,
        examples: ["business model", "revenue model", "monetization", "pricing", "how you make money"]
      },
      traction: {
        covered: false,
        priority: 2,
        examples: ["traction", "users", "customers", "growth", "metrics", "kpis"]
      },
      competition: {
        covered: false,
        priority: 3,
        examples: ["competitors", "competitive landscape", "differentiation", "unique selling proposition"]
      },
      go_to_market: {
        covered: false,
        priority: 4,
        examples: ["go to market", "marketing", "acquisition", "distribution", "sales"]
      },
      team: {
        covered: false,
        priority: 5,
        examples: ["team", "founders", "background", "experience"]
      }
    };

    // Get custom questions if available
    let customQuestions = [];
    let hasCustomQuestions = false;
    let customQuestionsAsked = 0;
    
    if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
      console.log(`Processing ${personaSettings.custom_questions.length} custom questions`);
      
      // Filter valid custom questions
      customQuestions = personaSettings.custom_questions
        .filter(q => {
          const isValid = q && 
                       typeof q === 'object' && 
                       typeof q.question === 'string' && 
                       q.question.trim().length > 0 &&
                       q.enabled !== false;
          
          if (isValid) {
            console.log(`Valid custom question: "${q.question.trim()}"`);
          } else {
            console.log(`Skipping invalid custom question:`, JSON.stringify(q));
          }
          
          return isValid;
        })
        .map((q, idx) => ({
          id: q.id || `custom-${idx}`,
          question: q.question.trim(),
          covered: false,
          priority: idx
        }));
      
      hasCustomQuestions = customQuestions.length > 0;
      
      if (hasCustomQuestions) {
        console.log("CUSTOM QUESTIONS TO USE:");
        customQuestions.forEach((q, idx) => {
          console.log(`  ${idx+1}. "${q.question}"`);
        });
      } else {
        console.log("No valid custom questions found, will use default topics only");
      }
    }

    // Check chat history to see which topics/questions have been covered
    if (chatHistory && chatHistory.length > 0) {
      console.log(`Analyzing ${chatHistory.length} messages to determine covered topics`);
      
      // Track covered topics
      for (const msg of chatHistory) {
        // Check for topic coverage in both AI and startup messages for more accurate tracking
        const msgLower = msg.content.toLowerCase();
        
        // Check custom questions first
        customQuestions.forEach(q => {
          if (!q.covered) {
            const questionKeywords = q.question.toLowerCase().split(' ')
              .filter(word => word.length > 3) // Filter out short words
              .map(word => word.replace(/[.,?!;:]/g, '')); // Remove punctuation
            
            const significantMatches = questionKeywords
              .filter(keyword => msgLower.includes(keyword))
              .length;
            
            // If more than 50% of significant words match, consider it covered
            if (significantMatches >= Math.ceil(questionKeywords.length * 0.5)) {
              q.covered = true;
              customQuestionsAsked++;
              console.log(`Custom question marked as covered: "${q.question}"`);
            }
          }
        });
        
        // Check standard topics
        Object.keys(topicCategories).forEach(topic => {
          if (!topicCategories[topic].covered) {
            // Check if any examples of this topic are in the message
            const topicCovered = topicCategories[topic].examples
              .some(example => msgLower.includes(example));
            
            if (topicCovered) {
              topicCategories[topic].covered = true;
              console.log(`Topic ${topic} marked as covered`);
            }
          }
        });
      }
    }
    
    // Create system prompt focused on natural conversation while covering important topics
    let systemPrompt = `You are an AI simulation of the investor ${investorName || "the investor"}, having a natural conversation with a startup founder to learn about their business. `;
    
    // Add custom system prompt from persona settings if available
    if (personaSettings && personaSettings.system_prompt) {
      systemPrompt += `\n\n${personaSettings.system_prompt}\n\n`;
    }
    
    systemPrompt += `\nYour goal is to have a natural, conversational discussion while ensuring you gather important information about the startup.`;
    
    // Add list of custom questions if available
    if (hasCustomQuestions) {
      const uncoveredCustomQuestions = customQuestions.filter(q => !q.covered);
      
      if (uncoveredCustomQuestions.length > 0) {
        systemPrompt += `\n\nYou should prioritize asking about the following topics that haven't been covered yet:`;
        uncoveredCustomQuestions.forEach((q, idx) => {
          systemPrompt += `\n- ${q.question}`;
        });
      } else {
        systemPrompt += `\n\nAll custom questions from the investor have been covered.`;
      }
    }
    
    // Add list of standard topics to be covered
    const uncoveredTopics = Object.keys(topicCategories)
      .filter(topic => !topicCategories[topic].covered)
      .sort((a, b) => topicCategories[a].priority - topicCategories[b].priority);
    
    if (uncoveredTopics.length > 0) {
      systemPrompt += `\n\n${hasCustomQuestions ? 'After covering custom questions, you' : 'You'} should also ensure you learn about these important topics that haven't been covered yet:`;
      uncoveredTopics.forEach(topic => {
        systemPrompt += `\n- ${topic.replace('_', ' ')}: ${topicCategories[topic].examples[0]}`;
      });
    } else if (customQuestionsAsked < customQuestions.length) {
      systemPrompt += `\n\nFocus on the remaining custom questions before wrapping up the conversation.`;
    } else {
      systemPrompt += `\n\nAll important topics have been covered. You can have a natural wrap-up conversation or ask follow-up questions on any topic.`;
    }

    // Replace restrictive instructions with more conversational guidance
    systemPrompt += `\n\nBe conversational and engage with the startup founder naturally. You can:
- Ask follow-up questions based on their responses
- Share brief insights or feedback
- Show interest in their startup
- Have a normal conversation flow
- Introduce yourself at the beginning
- Transition naturally between topics

Remember your primary goal is to gather information about the startup in a natural conversation while covering all important topics.`;

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
    
    // For empty or just starting conversations, craft a more personalized starter message
    if (!chatHistory || chatHistory.length === 0) {
      console.log("New conversation - crafting personalized introduction");
      
      // Call OpenAI for a personalized introduction
      const introResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are an AI simulation of the investor ${investorName || "the investor"}. Create a brief, friendly introduction followed by your first question to a startup founder. Start with a greeting and introduce yourself, then ask ONE question from the priority topics.` },
            ...(hasCustomQuestions ? [{ role: "user", content: `Start with a friendly greeting and then ask this first question: "${customQuestions[0].question}"` }] : 
              [{ role: "user", content: `Start with a friendly greeting and then ask about the startup's ${Object.keys(topicCategories)[0].replace('_', ' ')}.` }])
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });
      
      if (introResponse.ok) {
        const introData = await introResponse.json();
        const aiGreeting = introData.choices[0].message.content;
        
        console.log("Generated personalized greeting:", aiGreeting);
        
        // Return the personalized greeting directly
        return new Response(
          JSON.stringify({
            response: aiGreeting,
            matchScore: null,
            matchSummary: null,
            chatId,
            isQuestionPending: true,
            askedQuestions: hasCustomQuestions ? [customQuestions[0].id] : [],
            customQuestionsAsked: 0,
            totalCustomQuestions: customQuestions.length,
            allTopicsCovered: false
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    
    // Call OpenAI API for standard responses
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
    const aiResponse = data.choices[0].message.content;
    console.log("AI response:", aiResponse);
    
    // Check if all topics have been covered
    const allTopicsCovered = Object.values(topicCategories).every(topic => topic.covered) && 
      customQuestions.every(q => q.covered);
    
    // Calculate match score only if all topics are covered and there are enough messages
    let matchScore = null;
    let matchSummary = null;
    
    // Only calculate match score if ALL important topics have been covered
    // and there's been enough back-and-forth in the conversation
    if (allTopicsCovered && chatHistory && chatHistory.length > 8) {
      console.log("All important topics have been covered, generating match score...");
      
      // Extract key conversation insights from the chat history
      const startupResponses = chatHistory
        .filter(msg => msg.sender_type === "startup")
        .map(msg => msg.content)
        .join("\n\n");
      
      const scoringPrompt = `
I need a detailed investment match analysis based on a conversation between a startup founder and an investor.

STARTUP INFORMATION:
${JSON.stringify(startupInfo || "Information gathered only from conversation")}

CONVERSATION HIGHLIGHTS:
${startupResponses}

INVESTOR PREFERENCES:
${JSON.stringify(investorPreferences || "General investor with no specific preferences")}

Please provide:

1. A match score from 0-100 where 100 is a perfect match.
2. A detailed match summary with the following sections:
   - BUSINESS SUMMARY: Brief overview of what the startup does
   - KEY STRENGTHS: 2-3 bullet points on what makes this opportunity compelling
   - ALIGNMENT: How well this aligns with the investor's interests/preferences
   - POTENTIAL CONCERNS: Any areas that might need further clarification
   - RECOMMENDATION: Whether this appears to be a good investment opportunity

Format your response EXACTLY as a JSON object with these fields:
{
  "score": number,
  "summary": "detailed multi-paragraph summary with the sections above"
}`;

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
          temperature: 0.7,
          max_tokens: 1000,
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

    // Return the AI response with metadata about topic coverage
    return new Response(
      JSON.stringify({
        response: aiResponse,
        matchScore,
        matchSummary,
        chatId,
        isQuestionPending: !allTopicsCovered,
        customQuestionsAsked,
        totalCustomQuestions: customQuestions.length,
        allTopicsCovered,
        topicsCovered: Object.keys(topicCategories).filter(topic => topicCategories[topic].covered),
        topicsRemaining: Object.keys(topicCategories).filter(topic => !topicCategories[topic].covered)
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
