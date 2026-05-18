// Edge function: admin-update-repair-pricing
// Admin-only. Inserts a new pricing version and flips prior active to false.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Verify admin
  const { data: isAdmin } = await svc.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const body = await req.json();
  const rules = body?.rules;
  if (!rules || typeof rules !== "object") {
    return new Response(JSON.stringify({ error: "rules required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Get next version
  const { data: cur } = await svc.from("repair_pricing_rules").select("version").order("version", { ascending: false }).limit(1).maybeSingle();
  const nextVersion = (cur?.version ?? 0) + 1;

  // Flip previous active
  await svc.from("repair_pricing_rules").update({ is_active: false }).eq("is_active", true);

  const { data: inserted, error } = await svc.from("repair_pricing_rules").insert({
    version: nextVersion,
    is_active: true,
    rules,
    created_by: userId,
  }).select("*").single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  return new Response(JSON.stringify({ version: inserted.version, id: inserted.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
