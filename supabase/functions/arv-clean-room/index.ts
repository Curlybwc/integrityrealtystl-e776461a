/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Edge function: clean-room ARV from Repliers sold comps (v2 market-model estimator).
// NOT deployed / not wired into the UI — see docs/arv-clean-room/README.md.
//
// POST { mlsNumber?: string, subject?: Partial<Property>, options?: ArvOptions }
//   or { subjects: [{ mlsNumber?, subject? }, ...], options? }   (max 25)
// Requires a signed-in user (Bearer JWT) to protect the Repliers quota.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { estimateArvV2Batch, RepliersClient } from "../_shared/arv-clean-room/index.ts";
import type { SubjectInput } from "../_shared/arv-clean-room/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function isSignedIn(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    return !error && !!data?.user;
  } catch (_) {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!(await isSignedIn(req))) return json({ error: "Unauthorized" }, 401);

  const apiKey = Deno.env.get("REPLIERS_API_KEY");
  if (!apiKey) return json({ error: "REPLIERS_API_KEY not configured" }, 500);

  try {
    const body = await req.json();
    const rawSubjects: any[] = Array.isArray(body?.subjects) ? body.subjects : [body];
    if (rawSubjects.length > 25) return json({ error: "Max 25 subjects per request" }, 400);
    const inputs: SubjectInput[] = rawSubjects.map((s) => ({
      mlsNumber: typeof s?.mlsNumber === "string" ? s.mlsNumber : undefined,
      overrides: s?.subject && typeof s.subject === "object" ? s.subject : undefined,
    }));
    if (inputs.some((i) => !i.mlsNumber && !i.overrides)) {
      return json({ error: "Each subject needs mlsNumber or subject {lat,lng,sqft,...}" }, 400);
    }
    const client = new RepliersClient({ apiKey });
    const results = await estimateArvV2Batch(client, inputs, body?.options ?? {});
    return json(Array.isArray(body?.subjects) ? { results } : results[0]);
  } catch (err) {
    console.error("arv-clean-room failed:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
