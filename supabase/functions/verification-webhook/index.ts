
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Retrieve the request body
    const body = await req.text();

    // Create Stripe instance using the API key from environment variables
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature provided" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify the signature
    let event;
    try {
      const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Extract userId and verificationType from the metadata
      const userId = session.metadata?.userId;
      const verificationType = session.metadata?.verificationType;
      const paymentId = session.metadata?.paymentId;
      
      if (!userId || !verificationType || !paymentId) {
        throw new Error("Missing metadata in session");
      }
      
      // Update the verification payment status
      await supabaseClient
        .from("verification_payments")
        .update({
          payment_status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("user_id", userId);
      
      // Update the user's profile to mark them as verified
      await supabaseClient
        .from("profiles")
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          verified_type: verificationType,
        })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
