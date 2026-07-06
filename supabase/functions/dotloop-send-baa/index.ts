// Phase 1 (scaffold): Dotloop BAA send endpoint.
//
// Live Dotloop API calls are intentionally NOT wired yet — the customer does
// not have credentials. This function validates the caller, enforces the
// admin-vs-self rule, and returns a clean "Dotloop not configured" response
// until the three environment variables below are populated.
//
// Once credentials exist, replace the `sendViaDotloop` stub with the real
// template-based send flow (create loop from template → add buyer participant
// → persist returned loop_id / document_id). Everything else in this file —
// auth, admin check, idempotency, profile mutation contract — stays as-is.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Neutral credential names — token could be an OAuth access token or a
// long-lived personal token depending on what Dotloop issues this account.
// Both are consumed as `Authorization: Bearer <token>` server-side.
const DOTLOOP_TOKEN = Deno.env.get("DOTLOOP_ACCESS_TOKEN");
const DOTLOOP_PROFILE_ID = Deno.env.get("DOTLOOP_PROFILE_ID");
const DOTLOOP_BAA_TEMPLATE_ID = Deno.env.get("DOTLOOP_BAA_TEMPLATE_ID");

interface DotloopSendResult {
  loop_id: string;
  document_id: string | null;
  loop_url: string | null;
}

/**
 * Placeholder for the real Dotloop send flow. Kept isolated so it can be
 * replaced without touching the surrounding auth/idempotency logic.
 *
 * When credentials are available, implement the smallest reliable
 * template-driven flow:
 *   1. POST /profile/{profileId}/loop?templateId={tpl}&name={loopName}
 *   2. POST /profile/{profileId}/loop/{loopId}/participant  (buyer + email)
 *   3. Return loop_id (+ document_id if surfaced by the template response)
 */
async function sendViaDotloop(_args: {
  profile: { id: string; full_name: string | null; email: string; phone: string | null };
}): Promise<DotloopSendResult> {
  throw new Error("DOTLOOP_NOT_CONFIGURED");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { error: "Missing authorization" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
    const callerId = userData.user.id;

    let body: { target_user_id?: string } = {};
    try {
      body = (await req.json()) ?? {};
    } catch {
      body = {};
    }

    // Self-send unless an admin explicitly targets another user.
    let targetUserId = callerId;
    if (body.target_user_id && body.target_user_id !== callerId) {
      const { data: isAdmin } = await callerClient.rpc("has_role", {
        _user_id: callerId,
        _role: "admin",
      });
      if (!isAdmin) return json(403, { error: "Admin access required to send on behalf of another user" });
      targetUserId = body.target_user_id;
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, email, full_name, phone, baa_status, baa_dotloop_loop_id, baa_dotloop_document_id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profErr) return json(500, { error: profErr.message });
    if (!profile) return json(404, { error: "Profile not found" });

    if (profile.baa_status === "signed" || profile.baa_status === "verified") {
      return json(409, {
        error: "BAA already signed for this user",
        status: profile.baa_status,
      });
    }

    // Idempotent resend: if a loop already exists and status is 'sent',
    // return the existing IDs without creating a duplicate loop.
    if (profile.baa_dotloop_loop_id && profile.baa_status === "sent") {
      return json(200, {
        ok: true,
        already_sent: true,
        loop_id: profile.baa_dotloop_loop_id,
        document_id: profile.baa_dotloop_document_id,
        loop_url: `https://www.dotloop.com/m/loop?viewId=${profile.baa_dotloop_loop_id}`,
        status: "sent",
      });
    }

    // Guard: Dotloop credentials not yet provisioned.
    if (!DOTLOOP_TOKEN || !DOTLOOP_PROFILE_ID || !DOTLOOP_BAA_TEMPLATE_ID) {
      return json(503, {
        error: "Dotloop not configured",
        detail:
          "Dotloop credentials are not yet available. An administrator will send the Buyer's Agency Agreement manually. Please check back shortly.",
        code: "DOTLOOP_NOT_CONFIGURED",
      });
    }

    // Live path (currently unreachable until secrets are set).
    let result: DotloopSendResult;
    try {
      result = await sendViaDotloop({
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown Dotloop error";
      if (msg === "DOTLOOP_NOT_CONFIGURED") {
        return json(503, {
          error: "Dotloop not configured",
          code: "DOTLOOP_NOT_CONFIGURED",
        });
      }
      console.error("dotloop-send-baa failed:", msg);
      // Do NOT mutate the profile if Dotloop errored.
      return json(502, { error: "Dotloop send failed", detail: msg });
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        baa_status: "sent",
        baa_sent_at: now,
        baa_dotloop_loop_id: result.loop_id,
        baa_dotloop_document_id: result.document_id,
      })
      .eq("id", targetUserId);

    if (updateErr) return json(500, { error: updateErr.message });

    return json(200, {
      ok: true,
      loop_id: result.loop_id,
      document_id: result.document_id,
      loop_url: result.loop_url ?? `https://www.dotloop.com/m/loop?viewId=${result.loop_id}`,
      status: "sent",
    });
  } catch (err) {
    console.error("dotloop-send-baa unexpected error:", err);
    return json(500, { error: "Internal server error" });
  }
});
