
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STARTUP_PRICE = 1000; // $10.00
const INVESTOR_PRICE = 2000; // $20.00

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve user info from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    // Parse request data
    const { verificationType, verificationResponses } = await req.json();

    if (!verificationType || (verificationType !== "startup" && verificationType !== "investor")) {
      throw new Error("Invalid verification type");
    }

    // Set price based on user type
    const amount = verificationType === "startup" ? STARTUP_PRICE : INVESTOR_PRICE;
    const formattedPrice = (amount / 100).toFixed(2);

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key not configured");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Store verification responses
    await supabaseClient
      .from("profiles")
      .update({
        verification_responses: verificationResponses,
      })
      .eq("id", user.id);

    // Create or retrieve Stripe customer
    let customerId;
    const { data: existingCustomer } = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomer && existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
    } else if (user.email) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = newCustomer.id;
    }

    // Create a verification payment record
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from("verification_payments")
      .insert({
        user_id: user.id,
        amount: formattedPrice,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record:", paymentError);
      throw new Error("Failed to create payment record");
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Account Verification (${verificationType})`,
              description: `One-time verification fee for ${verificationType} account`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        verificationType,
        paymentId: paymentRecord.id,
      },
      mode: "payment",
      success_url: `${req.headers.get("origin")}/verification-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/settings`,
    });

    // Update payment record with Stripe session ID
    await supabaseClient
      .from("verification_payments")
      .update({
        payment_id: session.id,
      })
      .eq("id", paymentRecord.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Verification payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
