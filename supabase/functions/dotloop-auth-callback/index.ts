import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function htmlResponse(message: string, redirectTo: string, ok = true) {
  return new Response(
    `<!doctype html><html><body style="font-family: sans-serif; padding: 24px;">
      <h2>${ok ? "Dotloop connection complete" : "Dotloop connection failed"}</h2>
      <p>${message}</p>
      <p><a href="${redirectTo}">Return to Admin Integrations</a></p>
      <script>setTimeout(()=>{window.location.href=${JSON.stringify(redirectTo)}}, 1200)</script>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dotloopClientId = Deno.env.get("DOTLOOP_CLIENT_ID")!;
    const dotloopClientSecret = Deno.env.get("DOTLOOP_CLIENT_SECRET")!;
    const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "http://localhost:5173";

    const redirectTo = `${appBaseUrl}/portal/admin/integrations`;

    if (!supabaseUrl || !serviceRoleKey || !dotloopClientId || !dotloopClientSecret) {
      return htmlResponse("Server env vars are not configured.", redirectTo, false);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return htmlResponse("Missing OAuth code/state.", redirectTo, false);
    }

    const { data: stateRow, error: stateErr } = await adminClient
      .schema("private")
      .from("dotloop_oauth_states")
      .select("state,admin_user_id,expires_at")
      .eq("state", state)
      .maybeSingle();

    if (stateErr || !stateRow) {
      return htmlResponse("Invalid OAuth state.", redirectTo, false);
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await adminClient.schema("private").from("dotloop_oauth_states").delete().eq("state", state);
      return htmlResponse("OAuth state expired.", redirectTo, false);
    }

    const redirectUri = Deno.env.get("DOTLOOP_REDIRECT_URI") ?? `${supabaseUrl}/functions/v1/dotloop-auth-callback`;

    const tokenResp = await fetch("https://auth.dotloop.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: dotloopClientId,
        client_secret: dotloopClientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResp.ok) {
      const details = await tokenResp.text();
      await adminClient.from("admin_audit_log").insert({
        actor_user_id: stateRow.admin_user_id,
        action_type: "dotloop_connect_failure",
        target_table: "company_integrations",
        metadata: { details },
      });
      return htmlResponse("Token exchange failed.", redirectTo, false);
    }

    const tokenJson = await tokenResp.json();
    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString()
      : null;

    const { data: currentCfg } = await adminClient
      .from("company_integrations")
      .select("connected")
      .eq("provider", "dotloop")
      .maybeSingle();

    await adminClient
      .schema("private")
      .from("dotloop_tokens")
      .upsert({
        provider: "dotloop",
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        token_type: tokenJson.token_type,
        scope: tokenJson.scope,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider" });

    await adminClient
      .from("company_integrations")
      .upsert({
        provider: "dotloop",
        connected: true,
        connected_by: stateRow.admin_user_id,
        connected_at: new Date().toISOString(),
        account_label: tokenJson.account_name ?? "Dotloop Company Account",
        access_token_expires_at: expiresAt,
        health_status: "ok",
        error_metadata: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "provider" });

    await adminClient.from("admin_audit_log").insert({
      actor_user_id: stateRow.admin_user_id,
      action_type: currentCfg?.connected ? "dotloop_reconnect" : "dotloop_connect",
      target_table: "company_integrations",
      metadata: {
        provider: "dotloop",
        account_label: tokenJson.account_name ?? null,
      },
    });

    await adminClient.schema("private").from("dotloop_oauth_states").delete().eq("state", state);

    return htmlResponse("Connection successful.", redirectTo, true);
  } catch (error) {
    const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? "http://localhost:5173";
    return htmlResponse((error as Error).message, `${appBaseUrl}/portal/admin/integrations`, false);
  }
});
