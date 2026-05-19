// Edge function: process-repair-queue
// Worker that pulls pending repair_analyses rows, calls Lovable AI Vision,
// runs deterministic pricing (STL investor cost library v2), and writes the result back.

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
const ENGINE_VERSION = "repair-engine-v2";

// ----- Pricing engine (mirrors src/lib/repairPricing.ts) -----
type PricingRules = any;
type Observations = any;

function clamp01(n: number) { if (!isFinite(n) || n < 0) return 0; if (n > 1) return 1; return n; }

function emptyLineItems() {
  return {
    kitchen: 0, baths: 0, flooring: 0, paint_drywall: 0, interior_doors: 0,
    roof: 0, hvac: 0, water_heater: 0, electrical_panel: 0, appliances: 0,
    plumbing_stack: 0, foundation_reserve: 0, basement_reserve: 0, cleanout: 0,
    landscaping: 0, windows: 0, siding: 0, gutters: 0, garage_door: 0,
    driveway: 0, misc: 0, gut_rehab: 0,
  } as Record<string, number>;
}
const sum = (li: Record<string, number>) =>
  Object.values(li).reduce((a, b) => a + (Number(b) || 0), 0);

function priceRepairs(obs: Observations, sqft: number, mlsBaths: number, rules: PricingRules) {
  const li = emptyLineItems();
  const safeSqft = Math.max(0, sqft || 0);

  // Reserves apply in both modes
  const vCount = Math.max(0, Math.round(obs.foundation?.vertical_crack_count ?? 0));
  li.foundation_reserve =
    vCount * (rules.foundation_vertical_crack_each ?? 0) +
    (obs.foundation?.lateral_movement ? (rules.foundation_lateral_replace ?? 0) : 0);
  li.basement_reserve = obs.basement?.drain_tile_needed ? (rules.drain_tile_system ?? 0) : 0;
  li.electrical_panel = obs.electrical?.panel_replace_needed ? (rules.electrical_panel_replace ?? 0) : 0;

  // Cleanout (min 1 dumpster)
  const dumpsters = Math.max(1, Math.min(20, Math.round(obs.cleanout?.dumpsters_estimate ?? 1)));
  li.cleanout = dumpsters * (rules.dumpster_each ?? 0);

  // GUT REHAB BRANCH
  const gutMode = obs.gut_rehab_severity === "high";
  if (gutMode) {
    li.gut_rehab = Math.round(safeSqft * (rules.gut_per_sqft_high ?? 75));
    const sub = li.gut_rehab + li.foundation_reserve + li.basement_reserve + li.electrical_panel + li.cleanout;
    li.misc = Math.round(sub * (rules.misc_reserve_pct ?? 0.1));
    return { line_items: li, total: sum(li), gut_rehab_mode: true };
  }

  // Kitchen
  const k = obs.kitchen ?? { condition: "good", scope: "keep" };
  const cab = Math.max(0, Math.round(k.cabinet_count_estimate ?? 0));
  if (k.scope === "replace" || k.condition === "damaged" || k.condition === "missing") {
    li.kitchen = cab > 0
      ? cab * (rules.cabinet_replace_each ?? 0) + (rules.countertop_replace_kitchen ?? 0)
      : (rules.kitchen_fallback_replace ?? 0);
  } else if (k.scope === "light" || k.condition === "dated_oak") {
    const paint = cab > 0 ? cab * (rules.cabinet_paint_each ?? 0) : 800;
    li.kitchen = paint + (rules.countertop_replace_kitchen ?? 0) + (rules.kitchen_light_fixtures ?? 0);
  }

  // Bathrooms (per-fixture, capped by mls bath count)
  const capped = (obs.bathrooms ?? []).slice(0, Math.max(0, Math.ceil(mlsBaths || 0)));
  for (const b of capped) {
    if (b.tub_action === "glaze") li.baths += rules.bath_tub_glaze ?? 0;
    else if (b.tub_action === "replace") li.baths += rules.bath_tub_replace ?? 0;
    if (b.toilet_replace) li.baths += rules.bath_toilet_replace ?? 0;
    if (b.vanity_replace) li.baths += rules.bath_vanity_replace ?? 0;
    if (b.vanity_light_replace) li.baths += rules.bath_vanity_light ?? 0;
    if (b.fan_replace) li.baths += rules.bath_fan ?? 0;
  }

  // Flooring + paint (whole-house)
  li.flooring = Math.round(safeSqft * clamp01(obs.flooring?.pct_replace ?? 0) * (rules.flooring_per_sqft ?? 0));
  li.paint_drywall = Math.round(safeSqft * clamp01(obs.paint?.pct_paint ?? 0) * (rules.paint_per_sqft ?? 0));

  // Interior doors
  const doorCount = Math.max(0, Math.min(30, Math.round(obs.interior_doors?.damaged_count ?? 0)));
  li.interior_doors = doorCount * (rules.interior_door_each ?? 0);

  // Roof
  const newRoof = obs.remarks_signals?.new_roof && !obs.roof?.contradicted_by_photos;
  if (obs.roof?.needs_replacement && !newRoof) {
    const squares = (safeSqft / 100) * (rules.roof_overhead_multiplier ?? 1.25);
    li.roof = Math.round(squares * (rules.roof_per_square ?? 0));
  }

  // HVAC
  const newHvacRemark = (obs.remarks_signals?.new_hvac || obs.remarks_signals?.new_furnace) && !obs.hvac?.contradicted_by_photos;
  if (obs.hvac?.severity === "replace" && !newHvacRemark) li.hvac = rules.hvac_replace ?? 0;
  else if (obs.hvac?.severity === "repair" && !newHvacRemark) li.hvac = rules.hvac_repair_reserve ?? 0;

  // Water heater
  const newWh = obs.remarks_signals?.new_water_heater && !obs.water_heater?.contradicted_by_photos;
  if (obs.water_heater?.needs_replacement && !newWh) li.water_heater = rules.water_heater_replace ?? 0;

  // Appliances
  for (const a of new Set<string>(obs.appliances_missing ?? [])) {
    li.appliances += rules.appliances?.[a] ?? 0;
  }

  if (obs.plumbing_stack?.failure_evidence) li.plumbing_stack = rules.plumbing_stack_replace ?? 0;

  // Windows
  const winCount = Math.max(0, Math.min(60, Math.round(obs.windows?.replacement_count ?? 0)));
  li.windows = winCount * (rules.window_each ?? 0);

  // Landscaping
  const ls = obs.landscaping?.scope ?? "none";
  if (ls === "light") li.landscaping = rules.landscaping_light ?? 0;
  else if (ls === "overgrown") li.landscaping = rules.landscaping_overgrown ?? 0;
  else if (ls === "severe") li.landscaping = rules.landscaping_severe ?? 0;

  // Exterior
  const sidingPct = clamp01(obs.exterior?.siding_replace_pct ?? 0);
  li.siding = Math.round(safeSqft * sidingPct * (rules.siding_per_sqft ?? 0));
  li.gutters = obs.exterior?.gutters_replace ? (rules.gutters_replace ?? 0) : 0;
  li.garage_door = obs.exterior?.garage_door_replace ? (rules.garage_door_replace ?? 0) : 0;
  li.driveway = obs.exterior?.driveway_overlay ? (rules.driveway_overlay ?? 0) : 0;

  // Misc reserve: 10% of subtotal of everything else
  const subtotal = sum(li);
  li.misc = Math.round(subtotal * (rules.misc_reserve_pct ?? 0.1));

  return { line_items: li, total: sum(li), gut_rehab_mode: false };
}

// ----- Strict JSON schema for AI observations (v2) -----
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
          tub_action: { type: "string", enum: ["none", "glaze", "replace"] },
          toilet_replace: { type: "boolean" },
          vanity_replace: { type: "boolean" },
          vanity_light_replace: { type: "boolean" },
          fan_replace: { type: "boolean" },
        },
        required: ["type", "tub_action", "toilet_replace", "vanity_replace", "vanity_light_replace", "fan_replace"],
      },
    },
    flooring: { type: "object", additionalProperties: false, properties: { pct_replace: { type: "number" }, type_hint: { type: "string" } }, required: ["pct_replace"] },
    paint: { type: "object", additionalProperties: false, properties: { pct_paint: { type: "number" } }, required: ["pct_paint"] },
    interior_doors: { type: "object", additionalProperties: false, properties: { damaged_count: { type: "number" } }, required: ["damaged_count"] },
    roof: { type: "object", additionalProperties: false, properties: { needs_replacement: { type: "boolean" }, contradicted_by_photos: { type: "boolean" } }, required: ["needs_replacement", "contradicted_by_photos"] },
    hvac: { type: "object", additionalProperties: false, properties: { severity: { type: "string", enum: ["ok", "repair", "replace"] }, contradicted_by_photos: { type: "boolean" } }, required: ["severity", "contradicted_by_photos"] },
    water_heater: { type: "object", additionalProperties: false, properties: { needs_replacement: { type: "boolean" }, contradicted_by_photos: { type: "boolean" } }, required: ["needs_replacement", "contradicted_by_photos"] },
    appliances_missing: { type: "array", items: { type: "string", enum: ["stove", "fridge", "microwave", "dishwasher"] } },
    plumbing_stack: { type: "object", additionalProperties: false, properties: { failure_evidence: { type: "boolean" } }, required: ["failure_evidence"] },
    electrical: { type: "object", additionalProperties: false, properties: { panel_replace_needed: { type: "boolean" } }, required: ["panel_replace_needed"] },
    foundation: { type: "object", additionalProperties: false, properties: { vertical_crack_count: { type: "number" }, lateral_movement: { type: "boolean" } }, required: ["vertical_crack_count", "lateral_movement"] },
    basement: { type: "object", additionalProperties: false, properties: { drain_tile_needed: { type: "boolean" }, packed_with_contents: { type: "boolean" } }, required: ["drain_tile_needed", "packed_with_contents"] },
    cleanout: {
      type: "object", additionalProperties: false,
      properties: {
        dumpsters_estimate: { type: "number" },
        hoarder_level: { type: "string", enum: ["none", "light", "medium", "heavy"] },
        packed_basement: { type: "boolean" },
      },
      required: ["dumpsters_estimate", "hoarder_level", "packed_basement"],
    },
    landscaping: { type: "object", additionalProperties: false, properties: { scope: { type: "string", enum: ["none", "light", "overgrown", "severe"] } }, required: ["scope"] },
    windows: { type: "object", additionalProperties: false, properties: { replacement_count: { type: "number" } }, required: ["replacement_count"] },
    exterior: {
      type: "object", additionalProperties: false,
      properties: {
        siding_replace_pct: { type: "number" },
        gutters_replace: { type: "boolean" },
        garage_door_replace: { type: "boolean" },
        driveway_overlay: { type: "boolean" },
      },
      required: ["siding_replace_pct", "gutters_replace", "garage_door_replace", "driveway_overlay"],
    },
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
  required: [
    "kitchen", "bathrooms", "flooring", "paint", "interior_doors", "roof", "hvac", "water_heater",
    "appliances_missing", "plumbing_stack", "electrical", "foundation", "basement", "cleanout",
    "landscaping", "windows", "exterior", "gut_rehab_severity", "remarks_signals",
  ],
};

async function callVision(snapshot: any): Promise<Observations> {
  const photos: string[] = (snapshot.photo_urls ?? []).slice(0, MAX_PHOTOS);
  const systemPrompt = `You are a deterministic property condition evaluator for rent-ready, investor-grade STL rehab estimation.
Output strict JSON conforming to the provided schema. No prose.

You DETECT and CLASSIFY observable conditions only. You do NOT estimate costs — a deterministic pricing engine prices your observations.

Rules:
- Underwrite to rent-ready, not flip/luxury.
- Be conservative: do NOT recommend replacement unless evidence is clear in photos or remarks.
- If remarks say "new roof/hvac/furnace/water heater" set the corresponding system to no replacement, UNLESS photos clearly contradict (then set contradicted_by_photos=true).
- Cap bathroom entries at the MLS-listed bath count.
- Bathrooms: itemize per fixture (tub_action, toilet, vanity, vanity_light, fan). DO NOT account for paint or flooring inside bathrooms — those are counted whole-house.
- Kitchen: count ALL visible cabinets (uppers + lowers, no weighting). scope=keep|light|replace. light = paint cabs + counters + fixtures; replace = new cabs + counters.
- Interior doors: only count obviously damaged/missing doors; routine doors are absorbed in the paint package.
- Roof: do NOT measure geometry. Just set needs_replacement true/false; the engine sizes from sqft.
- Windows: count visible openings needing replacement (bay windows count as multiple).
- Electrical: panel_replace_needed only for clearly unsafe panels (Federal Pacific, Zinsco, double-tapped, scorched, no main).
- Foundation: vertical_crack_count = count of visible vertical cracks; lateral_movement = horizontal/bowing cracks or shifted walls.
- Basement: drain_tile_needed only if visible water intrusion or efflorescence patterns suggest perimeter drainage.
- Cleanout: dumpsters_estimate is the number of 40-yard dumpsters. Baseline 1 for any rehab. Furnished-but-junk = roughly 1 per 3 bedrooms. Heavy hoarder = roughly 1 per packed room (beds + LR + DR + kitchen). Packed basement adds ~2. Set hoarder_level + packed_basement accordingly.
- Landscaping: light (overdue trim) / overgrown (heavy weeds) / severe (brush + tree neglect).
- Exterior: siding_replace_pct 0..1 of house sqft only if siding is clearly failing across large area. Gutters/garage door/driveway: boolean replace-needed.
- gut_rehab_severity=high only when interior is stripped, fire/water destroyed, or remarks say "full gut/rehab".`;

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
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
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
