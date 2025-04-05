
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    console.log("Enabling realtime for messages table...")

    // First, set the replica identity to full if not already set
    const replicaIdentitySql = `
      ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;
    `;
    
    const { error: replicaError } = await supabaseAdmin.query(replicaIdentitySql);
    
    if (replicaError) {
      console.error("Error setting replica identity:", replicaError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error setting replica identity", 
          details: replicaError 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Add the table to the realtime publication
    const realtimeEnableSql = `
      BEGIN;
      
      -- Create the publication if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
        ) THEN
          CREATE PUBLICATION supabase_realtime;
        END IF;
      END
      $$;
      
      -- Add the table to the publication if it's not already added
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
      
      COMMIT;
    `;
    
    const { error: enableError } = await supabaseAdmin.query(realtimeEnableSql);
    
    if (enableError) {
      console.error("Error enabling realtime:", enableError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error enabling realtime", 
          details: enableError 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Verify that the setup is working correctly
    const verificationSql = `
      SELECT pg_get_publication_tables('supabase_realtime');
    `;
    
    const { data: verificationData, error: verificationError } = await supabaseAdmin.query(verificationSql);
    
    if (verificationError) {
      console.error("Error verifying realtime setup:", verificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Error verifying realtime setup", 
          details: verificationError 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Realtime enabled for messages table",
        tables: verificationData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Unexpected error", 
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
