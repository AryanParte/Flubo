
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = "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";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vsxnjnvwtgehagxbhdzh.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Processing search query:", query);
    console.log("User ID:", userId);

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Define the system prompt for startup search
    const systemPrompt = `You are an AI assistant that helps investors find startups based on natural language queries. 
    When given a query, return results as a JSON array of startup objects. Each object should have:
    - name: A plausible startup name
    - tagline: A brief description of what they do
    - industry: The industry they're in
    - stage: Funding stage (Seed, Series A, Series B, etc.)
    - location: City and country
    - foundedYear: Year founded
    - funding: Amount raised so far
    - matchScore: A number between 70-98 representing how well this matches the query
    - description: A paragraph about the startup
    Return between 3-6 results for each query.`;

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process search query", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIData = await openAIResponse.json();
    console.log("OpenAI response received");
    
    let results;
    try {
      // Extract the results from the OpenAI response
      const content = openAIData.choices[0]?.message?.content;
      results = JSON.parse(content);
      
      // Ensure results is an array
      if (!Array.isArray(results)) {
        if (typeof results === 'object' && results.results && Array.isArray(results.results)) {
          results = results.results;
        } else {
          throw new Error("Results is not an array");
        }
      }
      
      console.log(`Parsed ${results.length} results`);
    } catch (parseError) {
      console.error("Error parsing results:", parseError);
      console.log("Raw content:", openAIData.choices[0]?.message?.content);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse search results", 
          raw: openAIData.choices[0]?.message?.content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the search query and results in the database
    const { error: dbError } = await supabase
      .from('investor_ai_searches')
      .insert({
        investor_id: userId,
        query,
        results
      });

    if (dbError) {
      console.error("Error storing search:", dbError);
    }

    return new Response(
      JSON.stringify({ results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
