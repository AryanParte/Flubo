
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { profile_id, profile_user_type, profile_name, profile_email } = await req.json();
    
    // Validate required parameters
    if (!profile_id || !profile_user_type || !profile_name || !profile_email) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters. All of profile_id, profile_user_type, profile_name, and profile_email are required."
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Validate user_type
    if (!["startup", "investor", "partnership"].includes(profile_user_type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid profile_user_type. Must be one of: startup, investor, partnership"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL or service role key not set in environment");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to use the stored procedure first, if it fails, try direct insert
    try {
      const { error: rpcError } = await supabase.rpc(
        'create_profile',
        {
          profile_id,
          profile_user_type,
          profile_name,
          profile_email
        }
      );

      if (rpcError) {
        console.log("RPC approach failed, falling back to direct insert:", rpcError.message);
        // RPC failed, so we'll try direct insert next
        throw rpcError;
      } else {
        console.log(`Profile created successfully via RPC for user ${profile_id} with type ${profile_user_type}`);
        return new Response(
          JSON.stringify({ success: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    } catch (rpcError) {
      // Fall back to direct insert
      console.log("Attempting direct insert after RPC failure");
      const { error } = await supabase
        .from("profiles")
        .insert({
          id: profile_id,
          user_type: profile_user_type,
          name: profile_name,
          email: profile_email
        });

      if (error) {
        console.error("Error inserting profile:", error);
        throw error;
      }

      console.log(`Profile created successfully via direct insert for user ${profile_id} with type ${profile_user_type}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in create_profile function:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
