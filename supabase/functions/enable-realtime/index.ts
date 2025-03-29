
// This function enables real-time functionality for the messages table
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
    
    console.log("Attempting to enable realtime for messages");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Direct SQL approach to ensure realtime works
    const { data: tablesData, error: tablesError } = await supabase
      .from('_realtime_tables')
      .select('*');
      
    if (tablesError) {
      console.log("Checking realtime tables failed, proceeding with direct SQL");
    } else {
      console.log("Current realtime tables:", tablesData);
    }
    
    // Direct SQL to enable replica identity
    const { data: replicaData, error: replicaError } = await supabase.rpc('set_messages_replica_identity');
    
    if (replicaError) {
      console.error("Error setting replica identity via RPC:", replicaError);
      
      // Fallback to direct SQL if RPC fails
      const { error: directSqlError } = await supabase
        .from('messages')
        .select('id')
        .limit(1);
        
      if (directSqlError) {
        console.error("Error with fallback query:", directSqlError);
      } else {
        console.log("Successfully queried messages table");
      }
    } else {
      console.log("Successfully set replica identity", replicaData);
    }
    
    // Enable realtime for the messages table
    const { data: enableData, error: enableError } = await supabase.rpc('enable_realtime_for_messages');
    
    if (enableError) {
      console.error("Error enabling realtime via RPC:", enableError);
      return new Response(JSON.stringify({ error: "Failed to enable realtime", details: enableError }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("Successfully enabled realtime for messages", enableData);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Realtime functionality enabled for messages"
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
