// Deterministic repair pricing engine
// Source of truth lives server-side in supabase/functions/process-repair-queue.
// This client copy is used for type-sharing and any future client-side preview only.

export interface PricingRules {
  cost_per_cabinet: number;
  kitchen_fallback_replace: number;
  kitchen_light_rehab: number;
  countertop_per_cabinet: number;
  full_bath_replace: number;
  half_bath_replace: number;
  bath_partial: number;
  bath_refresh: number;
  roof_per_square: number;
  roof_overhead_multiplier: number;
  flooring_per_sqft: number;
  paint_drywall_per_sqft: number;
  drywall_widespread_per_sqft: number;
  hvac_replace: number;
  water_heater_replace: number;
  appliances: { stove: number; fridge: number; microwave: number; dishwasher: number };
  dumpster: number;
  plumbing_stack_replace: number;
  foundation_reserve_monitor: number;
  foundation_reserve_major: number;
  basement_water_reserve_minor: number;
  basement_water_reserve_major: number;
  landscaping_light: number;
  landscaping_heavy: number;
  misc_reserve: number;
  window_replace_each: number;
  gut_per_sqft_partial: number;
  gut_per_sqft_high: number;
}

export interface Observations {
  kitchen: { condition: "good" | "dated_oak" | "damaged" | "missing"; cabinet_count_estimate?: number; scope: "keep" | "light" | "replace" };
  bathrooms: Array<{ type: "full" | "half"; scope: "keep" | "refresh" | "partial" | "replace" }>;
  flooring: { pct_replace: number; type_hint?: string };
  paint_drywall: { pct_paint: number; drywall_damage: "none" | "patching" | "widespread" };
  roof: { needs_replacement: boolean; contradicted_by_photos: boolean };
  hvac: { needs_replacement: boolean; contradicted_by_photos: boolean };
  water_heater: { needs_replacement: boolean; contradicted_by_photos: boolean };
  appliances_missing: Array<"stove" | "fridge" | "microwave" | "dishwasher">;
  plumbing_stack: { failure_evidence: boolean };
  foundation: { concern: "none" | "monitor" | "major" };
  basement: { water_intrusion: "none" | "minor" | "major"; packed_with_contents: boolean };
  cleanout: { dumpsters_estimate: number };
  landscaping: { scope: "none" | "light" | "heavy" };
  windows: { obvious_failure_count: number };
  gut_rehab_severity: "none" | "partial" | "high";
  remarks_signals: {
    new_roof: boolean; new_hvac: boolean; new_furnace: boolean; new_water_heater: boolean;
    cash_only: boolean; full_rehab: boolean; no_utilities: boolean; sewer_problem: boolean;
  };
}

export interface LineItems {
  kitchen: number;
  baths: number;
  flooring: number;
  paint_drywall: number;
  roof: number;
  hvac: number;
  water_heater: number;
  appliances: number;
  plumbing_stack: number;
  foundation_reserve: number;
  basement_reserve: number;
  cleanout: number;
  landscaping: number;
  windows: number;
  misc: number;
  gut_rehab: number;
}

export interface PriceResult {
  line_items: LineItems;
  total: number;
  gut_rehab_mode: boolean;
}

export function priceRepairs(
  obs: Observations,
  sqft: number,
  mlsBaths: number,
  rules: PricingRules
): PriceResult {
  const li: LineItems = {
    kitchen: 0, baths: 0, flooring: 0, paint_drywall: 0, roof: 0, hvac: 0,
    water_heater: 0, appliances: 0, plumbing_stack: 0, foundation_reserve: 0,
    basement_reserve: 0, cleanout: 0, landscaping: 0, windows: 0,
    misc: rules.misc_reserve, gut_rehab: 0,
  };

  const safeSqft = Math.max(0, sqft || 0);

  // Gut rehab branch — supersedes line items but keeps reserves
  const gutMode = obs.gut_rehab_severity === "high";
  if (gutMode) {
    li.gut_rehab = Math.round(safeSqft * rules.gut_per_sqft_high);
    // foundation/basement reserves still apply if flagged
    if (obs.foundation.concern === "major") li.foundation_reserve = rules.foundation_reserve_major;
    else if (obs.foundation.concern === "monitor") li.foundation_reserve = rules.foundation_reserve_monitor;
    if (obs.basement.water_intrusion === "major") li.basement_reserve = rules.basement_water_reserve_major;
    else if (obs.basement.water_intrusion === "minor") li.basement_reserve = rules.basement_water_reserve_minor;
    li.misc = rules.misc_reserve;
    const total = sum(li);
    return { line_items: li, total, gut_rehab_mode: true };
  }

  // Kitchen
  if (obs.kitchen.scope === "replace" || obs.kitchen.condition === "damaged" || obs.kitchen.condition === "missing") {
    const cab = obs.kitchen.cabinet_count_estimate ?? 0;
    if (cab > 0) {
      li.kitchen = Math.round(cab * rules.cost_per_cabinet + cab * rules.countertop_per_cabinet);
    } else {
      li.kitchen = rules.kitchen_fallback_replace;
    }
  } else if (obs.kitchen.scope === "light" || obs.kitchen.condition === "dated_oak") {
    li.kitchen = rules.kitchen_light_rehab;
  }

  // Bathrooms — cap by MLS bath count (total entries)
  const capped = obs.bathrooms.slice(0, Math.max(0, Math.ceil(mlsBaths || 0)));
  for (const b of capped) {
    if (b.scope === "keep") continue;
    if (b.scope === "refresh") li.baths += rules.bath_refresh;
    else if (b.scope === "partial") li.baths += rules.bath_partial;
    else if (b.scope === "replace") li.baths += b.type === "full" ? rules.full_bath_replace : rules.half_bath_replace;
  }

  // Flooring (above-grade sqft basis)
  const pctReplace = clamp01(obs.flooring.pct_replace);
  li.flooring = Math.round(safeSqft * pctReplace * rules.flooring_per_sqft);

  // Paint/drywall
  const pctPaint = clamp01(obs.paint_drywall.pct_paint);
  let paintDrywall = safeSqft * pctPaint * rules.paint_drywall_per_sqft;
  if (obs.paint_drywall.drywall_damage === "widespread") {
    paintDrywall += safeSqft * 0.3 * rules.drywall_widespread_per_sqft;
  } else if (obs.paint_drywall.drywall_damage === "patching") {
    paintDrywall += safeSqft * 0.1 * rules.drywall_widespread_per_sqft;
  }
  li.paint_drywall = Math.round(paintDrywall);

  // Roof — squares = sqft / 100 * 1.2
  const newRoofRemark = obs.remarks_signals.new_roof && !obs.roof.contradicted_by_photos;
  if (obs.roof.needs_replacement && !newRoofRemark) {
    const squares = (safeSqft / 100) * rules.roof_overhead_multiplier;
    li.roof = Math.round(squares * rules.roof_per_square);
  }

  // HVAC
  const newHvac = (obs.remarks_signals.new_hvac || obs.remarks_signals.new_furnace) && !obs.hvac.contradicted_by_photos;
  if (obs.hvac.needs_replacement && !newHvac) li.hvac = rules.hvac_replace;

  // Water heater
  const newWh = obs.remarks_signals.new_water_heater && !obs.water_heater.contradicted_by_photos;
  if (obs.water_heater.needs_replacement && !newWh) li.water_heater = rules.water_heater_replace;

  // Appliances
  const seen = new Set(obs.appliances_missing);
  for (const a of seen) {
    li.appliances += rules.appliances[a] ?? 0;
  }

  // Plumbing stack
  if (obs.plumbing_stack.failure_evidence) li.plumbing_stack = rules.plumbing_stack_replace;

  // Foundation reserve
  if (obs.foundation.concern === "major") li.foundation_reserve = rules.foundation_reserve_major;
  else if (obs.foundation.concern === "monitor") li.foundation_reserve = rules.foundation_reserve_monitor;

  // Basement water reserve
  if (obs.basement.water_intrusion === "major") li.basement_reserve = rules.basement_water_reserve_major;
  else if (obs.basement.water_intrusion === "minor") li.basement_reserve = rules.basement_water_reserve_minor;

  // Cleanout (cap at sane upper bound)
  const dumpsters = Math.max(0, Math.min(10, Math.round(obs.cleanout.dumpsters_estimate || 0)));
  li.cleanout = dumpsters * rules.dumpster;

  // Landscaping
  if (obs.landscaping.scope === "light") li.landscaping = rules.landscaping_light;
  else if (obs.landscaping.scope === "heavy") li.landscaping = rules.landscaping_heavy;

  // Windows — only when obvious failure count > 0
  const winFail = Math.max(0, Math.min(40, Math.round(obs.windows.obvious_failure_count || 0)));
  li.windows = winFail * rules.window_replace_each;

  const total = sum(li);
  return { line_items: li, total, gut_rehab_mode: false };
}

export const REPAIR_LINE_LABELS: Record<keyof LineItems, string> = {
  kitchen: "Kitchen",
  baths: "Bathrooms",
  flooring: "Flooring",
  paint_drywall: "Paint / Drywall",
  roof: "Roof",
  hvac: "HVAC",
  water_heater: "Water Heater",
  appliances: "Appliances",
  plumbing_stack: "Plumbing Stack",
  foundation_reserve: "Foundation Reserve",
  basement_reserve: "Basement / Water Reserve",
  cleanout: "Cleanout / Dumpsters",
  landscaping: "Landscaping",
  windows: "Windows",
  misc: "Misc Reserve",
  gut_rehab: "Gut Rehab",
};

function clamp01(n: number): number {
  if (!isFinite(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sum(li: LineItems): number {
  return Object.values(li).reduce((a, b) => a + (b || 0), 0);
}

export const ENGINE_VERSION = "repair-engine-v1";
