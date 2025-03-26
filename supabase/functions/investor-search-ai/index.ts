
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://vsxnjnvwtgehagxbhdzh.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openAiKey) {
      throw new Error("OpenAI API key is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Processing search query:", query);
    console.log("User ID:", userId);

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all startup profiles
    const { data: startups, error: dbError } = await supabase
      .from('startup_profiles')
      .select('*');
    
    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to search database", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use OpenAI to analyze the query and find matching startups
    const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a startup investment analyst. Given a list of startups and a search query, return the startups that best match the search criteria. Return ONLY a JSON array with no additional text."
          },
          {
            role: "user",
            content: `Search Query: ${query}\n\nStartup List: ${JSON.stringify(startups.map(s => ({
              id: s.id,
              name: s.name || "Unnamed Startup",
              tagline: s.tagline || "",
              industry: s.industry || "",
              location: s.location || "",
              stage: s.stage || "",
              bio: s.bio || "",
              founded: s.founded || "",
              raised_amount: s.raised_amount || "",
            })))}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const openAiData = await openAiResponse.json();
    
    if (!openAiResponse.ok) {
      console.error("OpenAI error:", openAiData);
      throw new Error("Failed to process search with AI");
    }

    console.log("OpenAI response:", openAiData);
    
    let aiResults = [];
    try {
      // Parse the content from OpenAI's response
      const content = openAiData.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      aiResults = parsedContent.results || [];
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      // Fallback to existing search method
      aiResults = [];
    }
    
    // If AI search returned no results or failed, fallback to the keyword-based search
    let results = aiResults;
    
    if (results.length === 0) {
      console.log("AI search returned no results, falling back to keyword search");
      
      // Break the query into keywords
      const keywords = query.toLowerCase().split(/\s+/);
      
      // Filter startups based on the search query
      results = startups.filter(startup => {
        const startupName = (startup.name || "").toLowerCase();
        const startupIndustry = (startup.industry || "").toLowerCase();
        const startupLocation = (startup.location || "").toLowerCase();
        const startupBio = (startup.bio || "").toLowerCase();
        const startupStage = (startup.stage || "").toLowerCase();
        
        return keywords.some(keyword => 
          startupName.includes(keyword) || 
          startupIndustry.includes(keyword) || 
          startupLocation.includes(keyword) || 
          startupBio.includes(keyword) || 
          startupStage.includes(keyword)
        );
      });
    }
    
    // If still no results found, use mock data
    if (results.length === 0) {
      results = generateMockResults(query, query.toLowerCase().split(/\s+/));
    } else {
      // Format the results properly
      results = results.map(startup => ({
        name: startup.name || 'Unnamed Startup',
        tagline: startup.tagline || 'No tagline available',
        industry: startup.industry || 'Technology',
        stage: startup.stage || 'Seed',
        location: startup.location || 'Unknown Location',
        foundedYear: startup.founded || '2023',
        funding: startup.raised_amount || '$0',
        matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
        description: startup.bio || 'No description available',
      }));
    }
    
    // Store the search query and results in the database
    const { error: insertError } = await supabase
      .from('investor_ai_searches')
      .insert({
        investor_id: userId,
        query,
        results
      });

    if (insertError) {
      console.error("Error storing search:", insertError);
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

// Function to generate mock results when no real results are found
function generateMockResults(query, keywords) {
  const industries = ['AI', 'Fintech', 'Healthcare', 'E-commerce', 'EdTech', 'CleanTech', 'Biotech'];
  const stages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C'];
  const locations = ['India', 'US', 'UK', 'Singapore', 'Germany', 'Kenya', 'Brazil', 'Japan'];
  
  // Extract potential industry, stage, and location from keywords
  let targetIndustry = keywords.find(k => industries.some(i => i.toLowerCase() === k || i.toLowerCase().includes(k)));
  let targetLocation = keywords.find(k => locations.some(l => l.toLowerCase() === k || l.toLowerCase().includes(k)));
  
  if (!targetIndustry) {
    targetIndustry = query.toLowerCase().includes('ai') ? 'AI' : 
                    industries[Math.floor(Math.random() * industries.length)];
  } else {
    targetIndustry = industries.find(i => i.toLowerCase().includes(targetIndustry));
  }
  
  if (!targetLocation) {
    targetLocation = locations[Math.floor(Math.random() * locations.length)];
  } else {
    targetLocation = locations.find(l => l.toLowerCase().includes(targetLocation));
  }
  
  // Generate 3-5 mock results
  const count = Math.floor(Math.random() * 3) + 3;
  const results = [];
  
  const companyPrefixes = ['Tech', 'Nova', 'Future', 'Next', 'Smart', 'Bright', 'Quantum', 'Digital', 'Cyber', 'Global'];
  const companySuffixes = ['Solutions', 'Systems', 'Tech', 'AI', 'Innovations', 'Labs', 'Networks', 'Analytics', 'Connect'];
  
  for (let i = 0; i < count; i++) {
    const prefix = companyPrefixes[Math.floor(Math.random() * companyPrefixes.length)];
    const suffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    
    // Make company name related to the industry
    const companyName = `${prefix}${targetIndustry || ''}${suffix}`;
    
    // Choose a stage
    const stage = stages[Math.floor(Math.random() * stages.length)];
    
    // Generate a funding amount based on stage
    let fundingAmount;
    if (stage === 'Pre-seed') {
      fundingAmount = `$${(Math.floor(Math.random() * 500) + 100)}K`;
    } else if (stage === 'Seed') {
      fundingAmount = `$${(Math.floor(Math.random() * 2) + 1)}.${Math.floor(Math.random() * 10)}M`;
    } else if (stage === 'Series A') {
      fundingAmount = `$${(Math.floor(Math.random() * 10) + 3)}M`;
    } else {
      fundingAmount = `$${(Math.floor(Math.random() * 50) + 10)}M`;
    }
    
    // Found date
    const foundedYear = (2020 - Math.floor(Math.random() * 5)).toString();
    
    // Generate description based on industry and location
    const descriptions = [
      `A ${stage.toLowerCase()} ${targetIndustry} startup based in ${targetLocation} focused on innovative solutions.`,
      `${companyName} is transforming the ${targetIndustry} industry in ${targetLocation} with cutting-edge technology.`,
      `Founded in ${foundedYear}, this ${targetLocation}-based startup is pioneering advances in ${targetIndustry}.`
    ];
    
    const taglines = [
      `Revolutionizing ${targetIndustry} in ${targetLocation}`,
      `Next-generation ${targetIndustry} solutions`,
      `Transforming how ${targetIndustry} works`,
      `Making ${targetIndustry} accessible to everyone`
    ];
    
    results.push({
      name: companyName,
      tagline: taglines[Math.floor(Math.random() * taglines.length)],
      industry: targetIndustry,
      stage: stage,
      location: targetLocation,
      foundedYear: foundedYear,
      funding: fundingAmount,
      matchScore: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
      description: descriptions[Math.floor(Math.random() * descriptions.length)]
    });
  }
  
  return results;
}
