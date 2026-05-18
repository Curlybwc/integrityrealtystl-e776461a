// Edge function: process-repair-queue
// Worker that pulls pending repair_analyses rows, calls Lovable AI Vision,
// runs deterministic pricing, and writes the result back. Service-role internal.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const MAX_PHOTOS = 12;
const BATCH_SIZE = 3;
const MODEL = "google/gemini-2.5-flash";
const ENGINE_VERSION = "repair-engine-v1";

// ----- Pricing engine (mirrors src/lib/repairPricing.ts) -----
type PricingRules = Record<string, any>;
type Observations = any;

function clamp01(n: number) { if (!isFinite(n) || n < 0) return 0; if (n > 1) return 1; return n; }

function priceRepairs(obs: Observations, sqft: number, mlsBaths: number, rules: PricingRules) {
  const li: Record<string, number> = {
    kitchen: 0, baths: 0, flooring: 0, paint_drywall: 0, roof: 0, hvac: 0,
    water_heater: 0, appliances: 0, plumbing_stack: 0, foundation_reserve: 0,
    basement_reserve: 0, cleanout: 0, landscaping: 0, windows: 0,
    misc: rules.misc_reserve ?? 0, gut_rehab: 0,
  };
  const safeSqft = Math.max(0, sqft || 0);
  const gutMode = obs.gut_rehab_severity === "high";
  if (gutMode) {
    li.gut_rehab = Math.round(safeSqft * (rules.gut_per_sqft_high ?? 75));
    if (obs.foundation?.concern === "major") li.foundation_reserve = rules.foundation_reserve_major;
    else if (obs.foundation?.concern === "monitor") li.foundation_reserve = rules.foundation_reserve_monitor;
    if (obs.basement?.water_intrusion === "major") li.basement_reserve = rules.basement_water_reserve_major;
    else if (obs.basement?.water_intrusion === "minor") li.basement_reserve = rules.basement_water_reserve_minor;
    const total = Object.values(li).reduce((a, b) => a + b, 0);
    return { line_items: li, total, gut_rehab_mode: true };
  }
  // Kitchen
  const k = obs.kitchen ?? {};
  if (k.scope === "replace" || k.condition === "damaged" || k.condition === "missing") {
    const cab = k.cabinet_count_estimate ?? 0;
    li.kitchen = cab > 0
      ? Math.round(cab * (rules.cost_per_cabinet ?? 0) + cab * (rules.countertop_per_cabinet ?? 0))
      : (rules.kitchen_fallback_replace ?? 0);
  } else if (k.scope === "light" || k.condition === "dated_oak") {
    li.kitchen = rules.kitchen_light_rehab ?? 0;
  }
  // Baths
  const capped = (obs.bathrooms ?? []).slice(0, Math.max(0, Math.ceil(mlsBaths || 0)));
  for (const b of capped) {
    if (b.scope === "keep") continue;
    if (b.scope === "refresh") li.baths += rules.bath_refresh ?? 0;
    else if (b.scope === "partial") li.baths += rules.bath_partial ?? 0;
    else if (b.scope === "replace") li.baths += b.type === "full" ? rules.full_bath_replace : rules.half_bath_replace;
  }
  // Flooring
  li.flooring = Math.round(safeSqft * clamp01(obs.flooring?.pct_replace ?? 0) * (rules.flooring_per_sqft ?? 0));
  // Paint/drywall
  let pd = safeSqft * clamp01(obs.paint_drywall?.pct_paint ?? 0) * (rules.paint_drywall_per_sqft ?? 0);
  if (obs.paint_drywall?.drywall_damage === "widespread") pd += safeSqft * 0.3 * (rules.drywall_widespread_per_sqft ?? 0);
  else if (obs.paint_drywall?.drywall_damage === "patching") pd += safeSqft * 0.1 * (rules.drywall_widespread_per_sqft ?? 0);
  li.paint_drywall = Math.round(pd);
  // Roof
  const newRoof = obs.remarks_signals?.new_roof && !obs.roof?.contradicted_by_photos;
  if (obs.roof?.needs_replacement && !newRoof) {
    const squares = (safeSqft / 100) * (rules.roof_overhead_multiplier ?? 1.2);
    li.roof = Math.round(squares * (rules.roof_per_square ?? 0));
  }
  const newHvac = (obs.remarks_signals?.new_hvac || obs.remarks_signals?.new_furnace) && !obs.hvac?.contradicted_by_photos;
  if (obs.hvac?.needs_replacement && !newHvac) li.hvac = rules.hvac_replace ?? 0;
  const newWh = obs.remarks_signals?.new_water_heater && !obs.water_heater?.contradicted_by_photos;
  if (obs.water_heater?.needs_replacement && !newWh) li.water_heater = rules.water_heater_replace ?? 0;
  for (const a of new Set<string>(obs.appliances_missing ?? [])) {
    li.appliances += rules.appliances?.[a] ?? 0;
  }
  if (obs.plumbing_stack?.failure_evidence) li.plumbing_stack = rules.plumbing_stack_replace ?? 0;
  if (obs.foundation?.concern === "major") li.foundation_reserve = rules.foundation_reserve_major;
  else if (obs.foundation?.concern === "monitor") li.foundation_reserve = rules.foundation_reserve_monitor;
  if (obs.basement?.water_intrusion === "major") li.basement_reserve = rules.basement_water_reserve_major;
  else if (obs.basement?.water_intrusion === "minor") li.basement_reserve = rules.basement_water_reserve_minor;
  const dumpsters = Math.max(0, Math.min(10, Math.round(obs.cleanout?.dumpsters_estimate ?? 0)));
  li.cleanout = dumpsters * (rules.dumpster ?? 0);
  if (obs.landscaping?.scope === "light") li.landscaping = rules.landscaping_light ?? 0;
  else if (obs.landscaping?.scope === "heavy") li.landscaping = rules.landscaping_heavy ?? 0;
  const winFail = Math.max(0, Math.min(40, Math.round(obs.windows?.obvious_failure_count ?? 0)));
  li.windows = winFail * (rules.window_replace_each ?? 0);
  const total = Object.values(li).reduce((a, b) => a + b, 0);
  return { line_items: li, total, gut_rehab_mode: false };
}

const OBSERVATIONS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    kitchen: {
      type: "object", additionalProperties: false,
      properties: {
        condition: { type: "string", enum: ["good", "dated_oak", "damaged", "missing"] },
        cabinet_count_estimate: { type: "number" },
        scope: { type: "string", enum: ["keep", "light", "replace"] },
      },
      required: ["condition", "scope"],
    },
    bathrooms: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["full", "half"] },
          scope: { type: "string", enum: ["keep", "refresh", "partial", "replace"] },
        },
        required: ["type", "scope"],
      },
    },
    flooring: { type: "object", additionalProperties: false, properties: { pct_replace: { type: "number" }, type_hint: { type: "string" } }, required: ["pct_replace"] },
    paint_drywall: { type: "object", additionalProperties: false, properties: { pct_paint: { type: "number" }, drywall_damage: { type: "string", enum: ["none", "patching", "widespread"] } }, required: ["pct_paint", "drywall_damage"] },
    roof: { type: "object", additionalProperties: false, properties: { needs_replacement: { type: "boolean" }, contradicted_by_photos: { type: "boolean" } }, required: ["needs_replacement", "contradicted_by_photos"] },
    hvac: { type: "object", additionalProperties: false, properties: { needs_replacement: { type: "boolean" }, contradicted_by_photos: { type: "boolean" } }, required: ["needs_replacement", "contradicted_by_photos"] },
    water_heater: { type: "object", additionalProperties: false, properties: { needs_replacement: { type: "boolean" }, contradicted_by_photos: { type: "boolean" } }, required: ["needs_replacement", "contradicted_by_photos"] },
    appliances_missing: { type: "array", items: { type: "string", enum: ["stove", "fridge", "microwave", "dishwasher"] } },
    plumbing_stack: { type: "object", additionalProperties: false, properties: { failure_evidence: { type: "boolean" } }, required: ["failure_evidence"] },
    foundation: { type: "object", additionalProperties: false, properties: { concern: { type: "string", enum: ["none", "monitor", "major"] } }, required: ["concern"] },
    basement: { type: "object", additionalProperties: false, properties: { water_intrusion: { type: "string", enum: ["none", "minor", "major"] }, packed_with_contents: { type: "boolean" } }, required: ["water_intrusion", "packed_with_contents"] },
    cleanout: { type: "object", additionalProperties: false, properties: { dumpsters_estimate: { type: "number" } }, required: ["dumpsters_estimate"] },
    landscaping: { type: "object", additionalProperties: false, properties: { scope: { type: "string", enum: ["none", "light", "heavy"] } }, required: ["scope"] },
    windows: { type: "object", additionalProperties: false, properties: { obvious_failure_count: { type: "number" } }, required: ["obvious_failure_count"] },
    gut_rehab_severity: { type: "string", enum: ["none", "partial", "high"] },
    remarks_signals: {
      type: "object", additionalProperties: false,
      properties: {
        new_roof: { type: "boolean" }, new_hvac: { type: "boolean" }, new_furnace: { type: "boolean" }, new_water_heater: { type: "boolean" },
        cash_only: { type: "boolean" }, full_rehab: { type: "boolean" }, no_utilities: { type: "boolean" }, sewer_problem: { type: "boolean" },
      },
      required: ["new_roof", "new_hvac", "new_furnace", "new_water_heater", "cash_only", "full_rehab", "no_utilities", "sewer_problem"],
    },
  },
  required: ["kitchen", "bathrooms", "flooring", "paint_drywall", "roof", "hvac", "water_heater", "appliances_missing", "plumbing_stack", "foundation", "basement", "cleanout", "landscaping", "windows", "gut_rehab_severity", "remarks_signals"],
};

async function callVision(snapshot: any): Promise<Observations | null> {
  const photos: string[] = (snapshot.photo_urls ?? []).slice(0, MAX_PHOTOS);
  const systemPrompt = `You are a deterministic property condition evaluator for rent-ready investor-grade rehab estimation in St. Louis.
Output strict JSON conforming to the provided schema. No prose, no commentary.
Be conservative: do NOT recommend replacement unless evidence is clear in photos or remarks.
Underwrite to rent-ready, not flip-grade.
If remarks say "new roof/hvac/furnace/water heater", set needs_replacement=false unless photos clearly contradict (set contradicted_by_photos=true in that case).
Cap bathroom entries at the MLS-listed bath count.`;

  const userText = `Property facts:
- sqft (above grade): ${snapshot.sqft}
- beds: ${snapshot.beds}
- baths: ${snapshot.baths}
- basement finished sqft: ${snapshot.basement_finished_sqft ?? 0}
- year built: ${snapshot.year_built ?? "unknown"}
- public remarks: ${snapshot.remarks ?? "(none)"}

Analyze the attached MLS photos and produce the observations JSON.`;

  const content: any[] = [{ type: "text", text: userText }];
  for (const url of photos) content.push({ type: "image_url", image_url: { url } });

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "repair_observations", strict: true, schema: OBSERVATIONS_SCHEMA },
      },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("Vision call failed", resp.status, t);
    throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 200)}`);
  }
  const j = await resp.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty AI response");
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Load active pricing rules
  const { data: rulesRow } = await svc
    .from("repair_pricing_rules")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (!rulesRow) {
    return new Response(JSON.stringify({ error: "No active pricing rules" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const rules = rulesRow.rules as PricingRules;
  const pricingVersion = rulesRow.version as number;

  // Pull next batch of pending rows
  const { data: pending } = await svc
    .from("repair_analyses")
    .select("*")
    .eq("analysis_status", "pending")
    .eq("is_active", true)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(BATCH_SIZE);

  const rows = pending ?? [];
  const results: any[] = [];

  for (const row of rows) {
    // Mark analyzing
    await svc.from("repair_analyses").update({ analysis_status: "analyzing" }).eq("id", row.id);
    try {
      const snap = row.evidence_snapshot ?? {};
      const observations = await callVision(snap);
      const priced = priceRepairs(observations, snap.sqft ?? 0, snap.baths ?? 0, rules);

      await svc.from("repair_analyses").update({
        analysis_status: "complete",
        observations,
        line_items: priced.line_items,
        total_repair_estimate: priced.total,
        gut_rehab_mode: priced.gut_rehab_mode,
        pricing_version: pricingVersion,
        engine_version: ENGINE_VERSION,
        model: MODEL,
        photo_count_analyzed: Math.min(MAX_PHOTOS, (snap.photo_urls ?? []).length),
        analyzed_at: new Date().toISOString(),
      }).eq("id", row.id);

      results.push({ id: row.id, status: "complete", total: priced.total });
    } catch (e) {
      console.error("worker error", row.id, e);
      await svc.from("repair_analyses").update({
        analysis_status: "failed",
        failure_reason: (e as Error).message.slice(0, 500),
      }).eq("id", row.id);
      results.push({ id: row.id, status: "failed", error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
