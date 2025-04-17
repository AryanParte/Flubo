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
    let customQuestions = [];
    let defaultQuestions = [];
    let askedQuestions = new Set();

    // Performance optimization: Use a flag to track if we have custom questions
    let hasCustomQuestions = false;

    // Define default questions that should always be asked
    defaultQuestions = [
      "Tell me about your business model?",
      "What traction do you have so far?",
      "Who are your competitors and how do you differentiate?",
      "What's your go-to-market strategy?",
      "Tell me about your team background?"
    ].map((q, idx) => ({
      id: `default-${idx}`,
      question: q,
      asked: false,
      isCustom: false
    }));

    // Get custom questions if available
    if (personaSettings && personaSettings.custom_questions && personaSettings.custom_questions.length > 0) {
      console.log(`Processing ${personaSettings.custom_questions.length} custom questions`);
      
      // CRITICAL FIX: Immediately check if there are valid custom questions
      const validCustomQuestions = personaSettings.custom_questions.filter(q => {
        // A question is valid if it has text and is enabled
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
      });
      
      // Create proper question objects
      customQuestions = validCustomQuestions.map((q, idx) => ({
        id: q.id || `custom-${idx}`,
        question: q.question.trim(),
        asked: false,
        isCustom: true
      }));
      
      hasCustomQuestions = customQuestions.length > 0;
      
      // Log the questions we'll actually use
      if (hasCustomQuestions) {
        console.log("CUSTOM QUESTIONS TO USE:");
        customQuestions.forEach((q, idx) => {
          console.log(`  ${idx+1}. "${q.question}"`);
        });
      } else {
        console.log("No valid custom questions found, using default questions only");
      }
    }

    // CRITICAL FIX: Rebuild question sequence - ensure custom questions always come first
    requiredQuestions = [...customQuestions, ...defaultQuestions];
    
    console.log(`Final question sequence has ${requiredQuestions.length} questions (${customQuestions.length} custom + ${defaultQuestions.length} default)`);

    // Double check order by logging the final sequence
    console.log("FINAL QUESTION SEQUENCE:");
    requiredQuestions.forEach((q, idx) => {
      console.log(`  ${idx+1}. ${q.isCustom ? "[CUSTOM]" : "[default]"} "${q.question}"`);
    });

    // Verify custom questions come first
    if (hasCustomQuestions && requiredQuestions.length >= customQuestions.length) {
      const firstFewQuestions = requiredQuestions.slice(0, customQuestions.length);
      const allCustomFirst = firstFewQuestions.every(q => q.isCustom === true);
      
      if (!allCustomFirst) {
        console.error("CRITICAL ERROR: Custom questions are not at the beginning of the sequence!");
        // Force fix the order - rebuild the sequence
        requiredQuestions = [...customQuestions, ...defaultQuestions];
        console.log("FORCE FIXED QUESTION SEQUENCE:");
        requiredQuestions.forEach((q, idx) => {
          console.log(`  ${idx+1}. ${q.isCustom ? "[CUSTOM]" : "[default]"} "${q.question}"`);
        });
      } else {
        console.log("Verified custom questions are correctly positioned at the start of the sequence");
      }
    }
    
    // Check chat history to see which questions have been asked
    if (chatHistory && chatHistory.length > 0) {
      console.log(`Analyzing ${chatHistory.length} messages to determine asked questions`);
      
      // CRITICAL FIX: First reset all questions to not asked state to avoid any stale state
      requiredQuestions.forEach(q => {
        q.asked = false;
      });
      askedQuestions = new Set();
      
      for (const msg of chatHistory) {
        if (msg.sender_type === "ai") {
          for (const q of requiredQuestions) {
            if (q.asked) continue; // Skip already marked questions
            
            // More strict question matching - look for exact matches
            // This makes sure we're properly tracking what has been asked
            const questionLower = q.question.toLowerCase().trim();
            const msgLower = msg.content.toLowerCase().trim();
            
            // FIXED: Improve question matching with more reliable criteria
            // 1. Check for exact match
            const isExactMatch = msgLower === questionLower;
            
            // 2. Check if message contains the exact question string
            const isContainedMatch = msgLower.includes(questionLower);
            
            // 3. Check for substantial inclusion (80% of the question)
            const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3); // Only significant words
            const substMatchThreshold = Math.max(2, Math.floor(questionWords.length * 0.7)); // Lower threshold to 70%
            const wordMatches = questionWords.filter(word => msgLower.includes(word)).length;
            const isSubstantialMatch = questionWords.length > 0 && wordMatches >= substMatchThreshold;
            
            if (isExactMatch || isContainedMatch || isSubstantialMatch) {
              console.log(`Message matches question "${q.question}" - marking as asked`);
              console.log(`Match type: ${isExactMatch ? 'exact' : isContainedMatch ? 'contained' : 'substantial'}`);
              q.asked = true;
              askedQuestions.add(q.id);
              break; // Move to next message after finding a match
            }
          }
        }
      }
      
      // CRITICAL FIX: Special check for custom questions to ensure they're not skipped
      if (hasCustomQuestions) {
        const customQuestionsAsked = customQuestions.filter(q => q.asked).length;
        if (customQuestionsAsked === 0) {
          console.log("WARNING: No custom questions have been asked yet. Resetting all default questions to not asked state.");
          
          // If no custom questions have been asked, reset all default questions to ensure custom questions are asked first
          requiredQuestions.forEach(q => {
            if (!q.isCustom) {
              q.asked = false;
              if (askedQuestions.has(q.id)) {
                askedQuestions.delete(q.id);
              }
            }
          });
        }
      }
      
      // Log current question status
      requiredQuestions.forEach(q => {
        console.log(`Question status: "${q.question}" - ${q.asked ? 'already asked' : 'not asked yet'} (${q.isCustom ? 'custom' : 'default'})`);
      });
    }
    
    // CRITICAL FIX: Determine the next question to ask, prioritizing custom questions
    // Always use the first unanswered question in the list to preserve order
    let nextQuestionToAsk = requiredQuestions.find(q => !q.asked);
    
    // If we have custom questions and none have been asked yet, force a custom question
    if (hasCustomQuestions && !customQuestions.some(q => q.asked) && 
        nextQuestionToAsk && !nextQuestionToAsk.isCustom) {
      // Override with the first custom question regardless of sequence
      nextQuestionToAsk = customQuestions.find(q => !q.asked) || nextQuestionToAsk;
      console.log(`CRITICAL FIX: Forced next question to be a custom question: "${nextQuestionToAsk.question}"`);
    }
    
    if (nextQuestionToAsk) {
      console.log(`Next question to ask: "${nextQuestionToAsk.question}" (isCustom: ${nextQuestionToAsk.isCustom})`);
      console.log(`Question order: ${requiredQuestions.map(q => q.asked ? '✓' : '□').join(' ')}`);
    } else {
      console.log("All questions have been asked");
    }
    
    // For empty or just starting conversations, immediately ask the first question
    // instead of a generic greeting
    if ((!chatHistory || chatHistory.length === 0) && nextQuestionToAsk) {
      console.log("New conversation - returning first question directly:", nextQuestionToAsk.question);
      console.log(`Question is a ${nextQuestionToAsk.isCustom ? 'custom' : 'default'} question`);
      
      // CRITICAL FIX: For new conversations, make absolutely sure we start with a custom question if available
      if (hasCustomQuestions && !nextQuestionToAsk.isCustom) {
        const firstCustomQuestion = customQuestions.find(q => !q.asked);
        if (firstCustomQuestion) {
          console.log(`CRITICAL FIX: Forcing first message to be custom question: "${firstCustomQuestion.question}" instead of default question`);
          nextQuestionToAsk = firstCustomQuestion;
        }
      }
      
      // Return the first question directly without calling OpenAI
      return new Response(
        JSON.stringify({
          response: nextQuestionToAsk.question,
          matchScore: null,
          matchSummary: null,
          chatId,
          isQuestionPending: true,
          remainingQuestions: requiredQuestions.filter(q => !q.asked && q.id !== nextQuestionToAsk.id),
          askedQuestions: [nextQuestionToAsk.id],
          questionIsCustom: nextQuestionToAsk.isCustom,
          customQuestionsAsked: nextQuestionToAsk.isCustom ? 1 : 0,
          totalCustomQuestions: customQuestions.length,
          defaultQuestionsAsked: !nextQuestionToAsk.isCustom ? 1 : 0,
          totalDefaultQuestions: defaultQuestions.length
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
    
    // Include all questions in the system prompt to ensure the AI is aware of all it should ask
    // This helps prevent asking random questions not in the list
    systemPrompt += `\n\nYou must ONLY ask the following questions exactly as written, in this exact order:`;
    
    // Highlight which questions are custom (investor's own questions)
    requiredQuestions.forEach((q, idx) => {
      const questionType = q.isCustom ? 'CUSTOM' : 'default';
      const questionStatus = q.asked ? ' (already asked)' : ' (not asked yet)';
      systemPrompt += `\n${idx+1}. [${questionType}] "${q.question}"${questionStatus}`;
    });
    
    // CRITICAL FIX: Add specific instructions about question priority
    if (hasCustomQuestions) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST prioritize asking CUSTOM questions before default questions.`;
      systemPrompt += `\nCustom questions are the most important and should ALWAYS be asked first.`;
      
      // If no custom questions have been asked yet, emphasize this even more
      if (!customQuestions.some(q => q.asked)) {
        systemPrompt += `\n\nEXTREMELY IMPORTANT: You have not asked ANY custom questions yet. You MUST ask custom questions first!`;
      }
    }
    
    // Update system prompt to focus on asking the next unasked question
    if (nextQuestionToAsk) {
      const questionType = nextQuestionToAsk.isCustom ? 'CUSTOM' : 'default';
      systemPrompt += `\n\nCRITICAL INSTRUCTION: You MUST ask the following specific ${questionType} question VERBATIM. Do not modify, rephrase, or add to it in any way:\n"${nextQuestionToAsk.question}"\n`;
      systemPrompt += `\nYour ONLY task is to ask this exact question. Do not create additional questions or follow-ups.`;
      systemPrompt += `\nDo not introduce yourself or give a greeting. Just ask the question directly.`;
      systemPrompt += `\nDo not ask ANY other questions that were not explicitly specified in the list above.`;
      systemPrompt += `\nDo not ask questions about funding, financial projections, or any other topic unless it is EXPLICITLY in the list above.`;
      systemPrompt += `\nDo not provide a summary or conclusion of the conversation at this point.`;
    } else {
      // If all questions have been asked, prevent the AI from asking new questions
      systemPrompt += `\n\nALL questions have been asked. You must NOT ask any new questions.`;
      systemPrompt += `\nDo not ask ANY questions that were not explicitly specified in the list above.`;
      systemPrompt += `\nDo not ask follow-up questions or generate new questions on your own.`;
      systemPrompt += `\nYou may respond to the startup's message but ONLY with statements, not questions.`;
      systemPrompt += `\nIf you're unsure what to say, just thank the startup for their responses.`;
      systemPrompt += `\nDo NOT generate a summary of the conversation or try to provide conclusions unless explicitly asked.`;
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
        temperature: 0.2, // Lower temperature to make it more likely to follow instructions exactly
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
    if (nextQuestionToAsk) {
      // If the AI didn't actually ask the question properly, force it
      // Use strict matching to ensure the AI is asking exactly the required question
      const questionText = nextQuestionToAsk.question.trim();
      
      console.log(`Checking if AI response contains the next question: "${questionText}"`);
      
      // Check if the AI response contains the exact question
      if (!aiResponse.includes(questionText)) {
        console.log("AI didn't ask the exact question, forcing it");
        
        // For better UX, provide a brief transition if this isn't the first question
        if (chatHistory && chatHistory.length > 0) {
          aiResponse = `Thanks for that information. ${questionText}`;
        } else {
          aiResponse = questionText;
        }
      } else {
        console.log("AI correctly asked the question");
      }
      
      // Make sure the response doesn't contain other questions by removing anything after the first question mark
      // This prevents the AI from asking multiple questions in one response
      const questionEndPos = aiResponse.indexOf('?');
      if (questionEndPos > -1 && questionEndPos + 1 < aiResponse.length) {
        const afterQuestionMark = aiResponse.substring(questionEndPos + 1);
        // If there's content after the question mark that contains another question, trim it
        if (containsQuestion(afterQuestionMark)) {
          console.log("AI is trying to ask multiple questions, trimming to just one");
          aiResponse = aiResponse.substring(0, questionEndPos + 1);
        }
      }
      
      // Check for unwanted summary text in the response
      if (aiResponse.toLowerCase().includes("to summarize") || 
          aiResponse.toLowerCase().includes("in summary") ||
          aiResponse.toLowerCase().includes("to recap")) {
        console.log("AI is trying to summarize prematurely, removing summary text");
        aiResponse = questionText;
      }
    } else if (allQuestionsAsked(requiredQuestions)) {
      // If all questions have been asked, prevent any new questions
      if (containsQuestion(aiResponse)) {
        if (nextQuestionToAsk) {
          // If we still have a question to ask, don't summarize - make sure we ask the next question
          console.log("AI is mixing the next question with additional questions, focusing on next question only");
          aiResponse = questionText;
        } else if (allQuestionsAsked(requiredQuestions)) {
          // Only produce a summary when all questions have actually been asked
          console.log("AI is trying to ask a new question, intercepting it");
          aiResponse = "Thank you for sharing all this information. I appreciate your detailed responses.";
        }
      }
    }
    
    // Mark the next question as asked if we're returning it
    if (nextQuestionToAsk) {
      nextQuestionToAsk.asked = true;
      askedQuestions.add(nextQuestionToAsk.id);
    }
    
    // Calculate match score if all questions are asked and it's the last exchange
    let matchScore = null;
    let matchSummary = null;
    
    // Only calculate match score if ALL questions (default + custom) have been asked
    // and there's been enough back-and-forth in the conversation
    if (allQuestionsAsked(requiredQuestions)) {
      // Count the number of actual exchanges (question-answer pairs)
      // Each exchange is one AI question followed by one startup response
      // We need at least one exchange per question to have a complete conversation
      const minMessagesNeeded = requiredQuestions.length * 2 - 1;
      
      console.log(`Checking if conversation is complete: ${chatHistory?.length || 0} messages, need at least ${minMessagesNeeded}`);
      
      if (chatHistory && chatHistory.length >= minMessagesNeeded) {
        console.log("All required questions have been asked, generating match score...");
        
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
    }

    console.log(`Returning response. Questions remaining: ${requiredQuestions.filter(q => !q.asked).length}`);
    console.log(`Asked questions IDs: ${Array.from(askedQuestions).join(', ')}`);
    
    // Debug log the questions status
    console.log("Questions status:");
    requiredQuestions.forEach((q, idx) => {
      console.log(`  ${idx+1}. ${q.question.substring(0, 40)}... - ${q.asked ? 'ASKED' : 'NOT ASKED YET'} (${q.isCustom ? 'custom' : 'default'})`);
    });
    
    // Calculate remainingQuestions more explicitly for better debugging
    const remainingQuestions = requiredQuestions.filter(q => !q.asked);
    const isQuestionPending = remainingQuestions.length > 0;
    const customQuestionsAsked = requiredQuestions.filter(q => q.isCustom && q.asked).length;
    const totalCustomQuestions = requiredQuestions.filter(q => q.isCustom).length;
    const defaultQuestionsAsked = requiredQuestions.filter(q => !q.isCustom && q.asked).length;
    const totalDefaultQuestions = requiredQuestions.filter(q => !q.isCustom).length;

    console.log(`isQuestionPending: ${isQuestionPending} (${remainingQuestions.length} questions remaining)`);
    console.log(`Custom questions progress: ${customQuestionsAsked}/${totalCustomQuestions} asked`);
    console.log(`Default questions progress: ${defaultQuestionsAsked}/${totalDefaultQuestions} asked`);

    if (remainingQuestions.length > 0) {
      console.log("Next questions to ask:");
      remainingQuestions.slice(0, 3).forEach((q, idx) => {
        console.log(`  ${idx+1}. "${q.question}" (${q.isCustom ? 'custom' : 'default'})`);
      });
    }
    
    // CRITICAL FIX: Check if there are remaining custom questions that need to be asked
    const remainingCustomQuestions = customQuestions.filter(q => !q.asked);
    const nextQuestionIsCustom = remainingCustomQuestions.length > 0;
    
    if (nextQuestionIsCustom) {
      console.log(`IMPORTANT: ${remainingCustomQuestions.length} custom questions still need to be asked!`);
      console.log(`Next custom question will be: "${remainingCustomQuestions[0].question}"`);
    }
    
    return new Response(
      JSON.stringify({
        response: aiResponse,
        matchScore,
        matchSummary,
        chatId,
        isQuestionPending,
        remainingQuestions,
        askedQuestions: Array.from(askedQuestions),
        totalQuestions: requiredQuestions.length,
        askedCount: requiredQuestions.filter(q => q.asked).length,
        defaultQuestionsCount: requiredQuestions.filter(q => !q.isCustom).length,
        customQuestionsCount: requiredQuestions.filter(q => q.isCustom).length,
        customQuestionsAsked,
        totalCustomQuestions,
        defaultQuestionsAsked,
        totalDefaultQuestions,
        nextQuestionIsCustom,  // CRITICAL FIX: Add flag to indicate if next question is custom
        hasCustomQuestions,    // CRITICAL FIX: Add flag to indicate if there are custom questions at all
        remainingCustomCount: remainingCustomQuestions.length  // CRITICAL FIX: Add count of remaining custom questions
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

// Helper function to check if all questions have been asked
function allQuestionsAsked(questions) {
  const totalQuestions = questions.length;
  const askedQuestions = questions.filter(q => q.asked).length;
  console.log(`${askedQuestions}/${totalQuestions} questions have been asked`);
  
  // Separate default and custom questions for more detailed logging
  const defaultQs = questions.filter(q => !q.isCustom);
  const customQs = questions.filter(q => q.isCustom);
  const askedDefaultQs = defaultQs.filter(q => q.asked).length;
  const askedCustomQs = customQs.filter(q => q.asked).length;
  
  console.log(`Default questions: ${askedDefaultQs}/${defaultQs.length} asked`);
  console.log(`Custom questions: ${askedCustomQs}/${customQs.length} asked`);
  
  // CRITICAL FIX: Check if we have custom questions and if any have been asked
  const hasCustomQs = customQs.length > 0;
  
  // If we have custom questions but none have been asked, we can't consider all questions asked
  if (hasCustomQs && askedCustomQs === 0) {
    console.log("CRITICAL: Has custom questions but none have been asked yet - returning false");
    return false;
  }
  
  // List unanswered questions for debugging
  const unansweredQuestions = questions.filter(q => !q.asked);
  if (unansweredQuestions.length > 0) {
    console.log("Unanswered questions:");
    unansweredQuestions.forEach((q, idx) => {
      console.log(`  ${idx+1}. "${q.question}" (${q.isCustom ? 'custom' : 'default'})`);
    });
  }
  
  const allAsked = questions.every(q => q.asked);
  console.log(`All questions asked: ${allAsked}`);
  return allAsked;
}

// Helper function to detect if text contains a question
function containsQuestion(text) {
  // Check for question marks
  if (text.includes('?')) return true;
  
  // Check for common question patterns
  const questionPatterns = [
    /could you/i, /can you/i, /would you/i, /will you/i,
    /tell me/i, /explain/i, /describe/i, /elaborate/i,
    /what is/i, /what are/i, /how do/i, /how does/i,
    /who is/i, /who are/i, /when will/i, /where is/i
  ];
  
  return questionPatterns.some(pattern => pattern.test(text));
}
