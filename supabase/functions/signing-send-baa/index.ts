// 07.06 Packet INT-07.06-2: provider-neutral BAA send endpoint.
//
// Same HTTP contract and safety guards as the dotloop-send-baa scaffold
// (Bearer caller, self-send default, admin-vs-self via has_role,
// already-signed 409, idempotent resend, no profile mutation on provider
// failure) — with the send itself running through the signing provider
// abstraction (_shared/signing) on BoldSign, the adopted provider.
//
// Until BOLDSIGN_API_KEY + BOLDSIGN_BAA_TEMPLATE_ID are set in the
// project secrets, every send answers 503 SIGNING_NOT_CONFIGURED, the
// same clean "not configured" posture the scaffold has today.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createBoldSignProvider } from "../_shared/signing/boldsign.ts";
import { sendBaa, type BaaSendDeps } from "../_shared/signing/baa-send.ts";

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
    const apiKey = Deno.env.get("BOLDSIGN_API_KEY");
    const templateId = Deno.env.get("BOLDSIGN_BAA_TEMPLATE_ID");

    const deps: BaaSendDeps = {
      provider: apiKey ? createBoldSignProvider({ apiKey }) : null,
      templateId: templateId ?? null,
      async loadProfile(id) {
        const { data, error } = await admin
          .from("profiles")
          .select("id, email, full_name, baa_status")
          .eq("id", id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      async findOpenRequest(ownerId) {
        const { data, error } = await admin
          .from("signature_requests")
          .select("id, provider, provider_document_id, status")
          .eq("owner_id", ownerId)
          .eq("kind", "baa")
          .in("status", ["sent", "partially_signed"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      async createRequest(args) {
        const { data, error } = await admin
          .from("signature_requests")
          .insert({
            owner_id: args.ownerId,
            kind: "baa",
            provider: args.provider,
            provider_document_id: args.providerDocumentId,
            status: "sent",
            template_ref: args.templateRef,
            sent_by: args.sentBy,
          })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        const { error: signerErr } = await admin.from("signature_request_signers").insert({
          request_id: data.id,
          name: args.signerName,
          email: args.signerEmail,
          role: "Buyer",
          signer_order: 1,
          status: "pending",
        });
        if (signerErr) throw new Error(signerErr.message);
        return { id: data.id };
      },
      async markProfileSent(args) {
        const { error } = await admin
          .from("profiles")
          .update({
            baa_status: "sent",
            baa_sent_at: args.sentAt,
            baa_provider: args.provider,
            baa_signing_request_id: args.signingRequestId,
          })
          .eq("id", args.profileId);
        if (error) throw new Error(error.message);
      },
    };

    const result = await sendBaa(deps, { targetUserId, callerId });

    switch (result.outcome) {
      case "sent":
        return json(200, {
          ok: true,
          document_id: result.providerDocumentId,
          signing_request_id: result.requestId,
          status: "sent",
        });
      case "already_sent":
        return json(200, {
          ok: true,
          already_sent: true,
          document_id: result.providerDocumentId,
          signing_request_id: result.requestId,
          status: "sent",
        });
      case "already_signed":
        return json(409, { error: "BAA already signed for this user", status: result.status });
      case "profile_not_found":
        return json(404, { error: "Profile not found" });
      case "not_configured":
        return json(503, {
          error: "Signing provider not configured",
          detail:
            "Signing is not configured yet. An administrator will send the Buyer's Agency Agreement manually. Please check back shortly.",
          code: "SIGNING_NOT_CONFIGURED",
        });
      case "provider_failed":
        console.error("signing-send-baa provider failure:", result.detail);
        return json(502, { error: "Signing send failed", detail: result.detail });
    }
  } catch (err) {
    console.error("signing-send-baa unexpected error:", err);
    return json(500, { error: "Internal server error" });
  }
});
