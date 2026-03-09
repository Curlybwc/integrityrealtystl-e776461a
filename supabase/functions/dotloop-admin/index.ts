import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request, supabaseUrl: string, serviceRoleKey: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: "Missing Authorization header" };

  const token = authHeader.replace("Bearer ", "");
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: userResp, error: userErr } = await adminClient.auth.getUser(token);
  if (userErr || !userResp.user) return { error: "Invalid auth token" };

  const { data: roleRow } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userResp.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRow) return { error: "Admin role required" };

  return { adminClient, adminUser: userResp.user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing server env vars" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const auth = await requireAdmin(req, supabaseUrl, serviceRoleKey);
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { adminClient, adminUser } = auth;
    const body = await req.json();
    const action = body?.action as string;

    if (action === "status") {
      const { data: integration, error } = await adminClient
        .from("company_integrations")
        .select("provider,connected,connected_by,connected_at,account_label,last_sync_at,access_token_expires_at,health_status,error_metadata,updated_at")
        .eq("provider", "dotloop")
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ status: integration ?? { provider: "dotloop", connected: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      await adminClient.schema("private").from("dotloop_tokens").delete().eq("provider", "dotloop");

      await adminClient
        .from("company_integrations")
        .upsert({
          provider: "dotloop",
          connected: false,
          health_status: "disconnected",
          error_metadata: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "provider" });

      await adminClient.from("admin_audit_log").insert({
        actor_user_id: adminUser.id,
        action_type: "dotloop_disconnect",
        target_table: "company_integrations",
        metadata: { provider: "dotloop" },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh") {
      const dotloopClientId = Deno.env.get("DOTLOOP_CLIENT_ID");
      const dotloopClientSecret = Deno.env.get("DOTLOOP_CLIENT_SECRET");
      if (!dotloopClientId || !dotloopClientSecret) {
        return new Response(JSON.stringify({ error: "Dotloop env vars missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: tokenRow } = await adminClient
        .schema("private")
        .from("dotloop_tokens")
        .select("refresh_token")
        .eq("provider", "dotloop")
        .maybeSingle();

      if (!tokenRow?.refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token available" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const refreshResp = await fetch("https://auth.dotloop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenRow.refresh_token,
          client_id: dotloopClientId,
          client_secret: dotloopClientSecret,
        }),
      });

      if (!refreshResp.ok) {
        const details = await refreshResp.text();
        await adminClient
          .from("company_integrations")
          .upsert({
            provider: "dotloop",
            health_status: "error",
            error_metadata: { refresh_error: details },
            updated_at: new Date().toISOString(),
          }, { onConflict: "provider" });

        await adminClient.from("admin_audit_log").insert({
          actor_user_id: adminUser.id,
          action_type: "dotloop_refresh_failure",
          target_table: "company_integrations",
          metadata: { details },
        });

        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshJson = await refreshResp.json();
      const expiresAt = refreshJson.expires_in
        ? new Date(Date.now() + Number(refreshJson.expires_in) * 1000).toISOString()
        : null;

      await adminClient
        .schema("private")
        .from("dotloop_tokens")
        .upsert({
          provider: "dotloop",
          access_token: refreshJson.access_token,
          refresh_token: refreshJson.refresh_token ?? tokenRow.refresh_token,
          token_type: refreshJson.token_type,
          scope: refreshJson.scope,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "provider" });

      await adminClient
        .from("company_integrations")
        .upsert({
          provider: "dotloop",
          connected: true,
          access_token_expires_at: expiresAt,
          health_status: "ok",
          error_metadata: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "provider" });

      await adminClient.from("admin_audit_log").insert({
        actor_user_id: adminUser.id,
        action_type: "dotloop_refresh",
        target_table: "company_integrations",
        metadata: { provider: "dotloop" },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
