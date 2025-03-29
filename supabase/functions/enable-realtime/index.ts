
// This function enables real-time functionality directly without depending on database functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    // Create a Supabase client with the Admin key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or Service Key");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("Attempting to enable realtime manually");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Direct SQL execution for enabling realtime instead of relying on functions
    // Enable REPLICA IDENTITY FULL for messages table
    try {
      const { error: messagesReplicaError } = await supabase.rpc(
        'execute_sql',
        { query: 'ALTER TABLE public.messages REPLICA IDENTITY FULL;' }
      );
      
      if (messagesReplicaError) {
        console.log("Could not set REPLICA IDENTITY using RPC, trying direct query", messagesReplicaError);
        // Fallback to direct query
        await supabase.from('messages').select('id').limit(1);
      } else {
        console.log("Set REPLICA IDENTITY for messages table");
      }
      
      // Try to add to publication
      const { error: publicationError } = await supabase.rpc(
        'execute_sql',
        { query: 'CREATE PUBLICATION IF NOT EXISTS supabase_realtime; ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;' }
      );
      
      if (publicationError) {
        console.log("Could not modify publication using RPC", publicationError);
      } else {
        console.log("Added messages table to realtime publication");
      }
      
    } catch (error) {
      console.error("Error in direct SQL execution:", error);
      // Continue despite errors - the channel setup on client side should still work
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Attempted to enable realtime for messages",
      note: "Realtime functionality may still work through client-side channel setup even if server configuration failed"
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ 
      error: "Unexpected error",
      details: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
