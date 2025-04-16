import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investorId, customQuestions } = await req.json();
    
    if (!investorId) {
      return new Response(
        JSON.stringify({ error: "Missing investor ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First check if settings exist for this investor
    const { data: existingSettings, error: findError } = await supabase
      .from('investor_ai_persona_settings')
      .select('id')
      .eq('user_id', investorId)
      .maybeSingle();
      
    if (findError && findError.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: `Error checking existing settings: ${findError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Prepare default custom questions if none were provided
    const questionArray = customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0 
      ? customQuestions 
      : [
          { 
            id: crypto.randomUUID(), 
            question: "What problem is your startup solving?", 
            enabled: true 
          },
          { 
            id: crypto.randomUUID(), 
            question: "How did you come up with this idea?", 
            enabled: true 
          }
        ];
    
    // Ensure all questions have IDs
    const sanitizedQuestions = questionArray.map(q => ({
      ...q,
      id: q.id || crypto.randomUUID(),
      question: typeof q.question === 'string' ? q.question.trim() : "Missing question text",
      enabled: q.enabled !== false
    }));
    
    let operation;
    if (existingSettings) {
      // Update existing settings
      operation = supabase
        .from('investor_ai_persona_settings')
        .update({ 
          custom_questions: sanitizedQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', investorId);
    } else {
      // Create new settings
      operation = supabase
        .from('investor_ai_persona_settings')
        .insert({
          user_id: investorId,
          custom_questions: sanitizedQuestions,
          system_prompt: "You are an AI simulation of an investor interviewing startup founders.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    const { error: saveError } = await operation;
    
    if (saveError) {
      return new Response(
        JSON.stringify({ error: `Failed to save settings: ${saveError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingSettings ? "Updated existing settings" : "Created new settings",
        investorId,
        questionCount: sanitizedQuestions.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}); 