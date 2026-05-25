// Edge function: admin-override-repair-analysis
// Admin-only. Updates the active repair_analyses row for an mls_listing_id
// with manually-edited line items and recomputes the total.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return j({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return j({ error: "Unauthorized" }, 401);

    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await svc.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return j({ error: "Admin role required" }, 403);

    const body = await req.json();
    const mlsListingId: string = body?.mls_listing_id;
    const lineItemsIn = body?.line_items;
    const gutMode: boolean = !!body?.gut_rehab_mode;
    if (!mlsListingId || typeof mlsListingId !== "string") return j({ error: "mls_listing_id required" }, 400);
    if (!lineItemsIn || typeof lineItemsIn !== "object") return j({ error: "line_items required" }, 400);

    // Sanitize: numeric only, non-negative
    const lineItems: Record<string, number> = {};
    let total = 0;
    for (const [k, v] of Object.entries(lineItemsIn)) {
      const n = Math.max(0, Math.round(Number(v) || 0));
      lineItems[k] = n;
      total += n;
    }

    const { data: existing } = await svc
      .from("repair_analyses")
      .select("id")
      .eq("mls_listing_id", mlsListingId)
      .eq("is_active", true)
      .maybeSingle();

    if (!existing) return j({ error: "No active analysis to override. Run analysis first." }, 404);

    const { data: updated, error } = await svc
      .from("repair_analyses")
      .update({
        line_items: lineItems,
        total_repair_estimate: total,
        gut_rehab_mode: gutMode,
        analysis_status: "complete",
        overridden_by: userId,
        overridden_at: new Date().toISOString(),
        failure_reason: null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      console.error("admin-override update failed:", error);
      return j({ error: "Update failed" }, 500);
    }
    return j({ analysis: updated });
  } catch (e) {
    console.error("admin-override-repair-analysis", e);
    return j({ error: "Internal server error" }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
