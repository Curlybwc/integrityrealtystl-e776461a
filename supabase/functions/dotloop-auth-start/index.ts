import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function randomState() {
  return crypto.randomUUID().replace(/-/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dotloopClientId = Deno.env.get("DOTLOOP_CLIENT_ID")!;

    if (!supabaseUrl || !serviceRoleKey || !dotloopClientId) {
      return new Response(JSON.stringify({ error: "Missing required env vars" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: userResp, error: userErr } = await adminClient.auth.getUser(token);
    if (userErr || !userResp.user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userResp.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const state = randomState();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: stateErr } = await adminClient
      .schema("private")
      .from("dotloop_oauth_states")
      .insert({
        state,
        admin_user_id: userResp.user.id,
        expires_at: expiresAt,
      });

    if (stateErr) {
      return new Response(JSON.stringify({ error: stateErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const redirectUri = Deno.env.get("DOTLOOP_REDIRECT_URI") ?? `${supabaseUrl}/functions/v1/dotloop-auth-callback`;
    const authUrl = new URL("https://auth.dotloop.com/oauth/authorize");
    authUrl.searchParams.set("client_id", dotloopClientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);

    return new Response(JSON.stringify({ auth_url: authUrl.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
