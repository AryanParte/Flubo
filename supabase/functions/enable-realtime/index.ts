
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
    
    console.log("Enabling realtime functionality for tables");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // List of tables we want to enable for realtime
    const tablesToEnable = [
      'messages',
      'investor_preferences',
      'startup_notification_settings',
      'startup_profiles',
      'post_likes',
      'comments',
      'posts'
    ];
    
    const results = {
      replicaIdentity: {},
      publication: {},
      channels: {},
      subscriptions: {}
    };
    
    // Enable REPLICA IDENTITY FULL for each table
    for (const table of tablesToEnable) {
      try {
        const { error } = await supabase.rpc(
          'execute_sql',
          { query: `ALTER TABLE public.${table} REPLICA IDENTITY FULL;` }
        );
        
        if (error) {
          console.log(`Could not set REPLICA IDENTITY for ${table} using RPC`, error);
          
          // Try direct query as fallback (might work for some scenarios)
          try {
            await supabase.from(table).select('id').limit(1);
            console.log(`Attempted fallback for ${table}`);
            results.replicaIdentity[table] = 'attempted_fallback';
          } catch (e) {
            console.error(`Fallback for ${table} failed:`, e);
            results.replicaIdentity[table] = 'failed';
          }
        } else {
          console.log(`Set REPLICA IDENTITY FULL for ${table}`);
          results.replicaIdentity[table] = 'success';
        }
      } catch (e) {
        console.error(`Error setting REPLICA IDENTITY for ${table}:`, e);
        results.replicaIdentity[table] = 'error';
      }
    }
    
    // Create publication if it doesn't exist
    try {
      const { error: createPubError } = await supabase.rpc(
        'execute_sql',
        { query: 'CREATE PUBLICATION IF NOT EXISTS supabase_realtime;' }
      );
      
      if (createPubError) {
        console.log("Could not create publication", createPubError);
        results.publication.create = 'failed';
      } else {
        console.log("Created or confirmed supabase_realtime publication");
        results.publication.create = 'success';
      }
    } catch (e) {
      console.error("Error creating publication:", e);
      results.publication.create = 'error';
    }
    
    // Add tables to publication
    for (const table of tablesToEnable) {
      try {
        const { error } = await supabase.rpc(
          'execute_sql',
          { query: `ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};` }
        );
        
        if (error) {
          // Ignore if table is already in publication
          if (error.message.includes('already in publication')) {
            console.log(`${table} is already in publication`);
            results.publication[table] = 'already_exists';
          } else {
            console.log(`Could not add ${table} to publication`, error);
            results.publication[table] = 'failed';
          }
        } else {
          console.log(`Added ${table} to supabase_realtime publication`);
          results.publication[table] = 'success';
        }
      } catch (e) {
        console.error(`Error adding ${table} to publication:`, e);
        results.publication[table] = 'error';
      }
    }
    
    // Create realtime channels
    const channelsToCreate = [
      'startup-messages', 
      'investor-messages', 
      'preference-updates', 
      'startup-profiles', 
      'post-comments', 
      'post-likes'
    ];
    
    try {
      const channelsQuery = channelsToCreate.map(channel => 
        `('${channel}')`).join(', ');
        
      const { error } = await supabase.rpc(
        'execute_sql',
        { 
          query: `
          INSERT INTO supabase_realtime.realtime_channels (name)
          VALUES ${channelsQuery}
          ON CONFLICT (name) DO NOTHING;
          `
        }
      );
      
      if (error) {
        console.log("Could not create realtime channels", error);
        results.channels.create = 'failed';
      } else {
        console.log("Created realtime channels");
        results.channels.create = 'success';
      }
    } catch (e) {
      console.error("Error creating realtime channels:", e);
      results.channels.create = 'error';
    }
    
    // Create subscription rules
    try {
      const subscriptionRules = tablesToEnable.map(table => 
        `('public:${table}', '{}', '{"role":"authenticated"}')`
      ).join(', ');
      
      const { error } = await supabase.rpc(
        'execute_sql',
        { 
          query: `
          INSERT INTO supabase_realtime.subscription (entity, filters, claims)
          VALUES ${subscriptionRules}
          ON CONFLICT DO NOTHING;
          `
        }
      );
      
      if (error) {
        console.log("Could not create subscription rules", error);
        results.subscriptions.create = 'failed';
      } else {
        console.log("Created subscription rules");
        results.subscriptions.create = 'success';
      }
    } catch (e) {
      console.error("Error creating subscription rules:", e);
      results.subscriptions.create = 'error';
    }
    
    // Confirm replica identity status for messages table (most important)
    try {
      const { data, error } = await supabase.rpc(
        'execute_sql',
        { 
          query: `
          SELECT relreplident 
          FROM pg_class 
          WHERE oid = 'public.messages'::regclass;
          `
        }
      );
      
      if (error) {
        console.log("Could not check replica identity status", error);
      } else {
        results.status = { 
          checked: true,
          replica_identity: data && data.length > 0 ? data[0].relreplident : 'unknown'
        };
        console.log("Replica identity status:", results.status);
      }
    } catch (e) {
      console.error("Error checking replica identity status:", e);
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Attempted to enable realtime for database tables",
      details: results
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
