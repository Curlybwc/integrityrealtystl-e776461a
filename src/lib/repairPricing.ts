// Deterministic STL investor-grade repair pricing engine (v2).
// Source of truth is mirrored in supabase/functions/process-repair-queue.
// The AI model only classifies observable conditions; this engine prices them.

export interface PricingRules {
  // Kitchen
  cabinet_paint_each: number;
  cabinet_replace_each: number;
  countertop_replace_kitchen: number;
  kitchen_light_fixtures: number;
  kitchen_fallback_replace: number;

  // Bathrooms (per-fixture)
  bath_tub_glaze: number;
  bath_tub_replace: number;
  bath_toilet_replace: number;
  bath_vanity_replace: number;
  bath_vanity_light: number;
  bath_fan: number;

  // Appliances
  appliances: { stove: number; fridge: number; microwave: number; dishwasher: number };

  // Whole-house finishes
  flooring_per_sqft: number;
  paint_per_sqft: number;
  interior_door_each: number;

  // Roof
  roof_per_square: number;
  roof_overhead_multiplier: number;

  // Systems
  hvac_replace: number;
  hvac_repair_reserve: number;
  water_heater_replace: number;
  electrical_panel_replace: number;
  plumbing_stack_replace: number;
  window_each: number;

  // Foundation / basement
  foundation_vertical_crack_each: number;
  foundation_lateral_replace: number;
  drain_tile_system: number;

  // Cleanout / exterior
  dumpster_each: number;
  landscaping_light: number;
  landscaping_overgrown: number;
  landscaping_severe: number;
  siding_per_sqft: number;
  gutters_replace: number;
  garage_door_replace: number;
  driveway_overlay: number;

  // Reserves
  misc_reserve_pct: number;

  // Gut rehab
  gut_per_sqft_partial: number;
  gut_per_sqft_high: number;
}

export interface Observations {
  kitchen: {
    condition: "good" | "dated_oak" | "damaged" | "missing";
    cabinet_count_estimate?: number;
    scope: "keep" | "light" | "replace";
  };
  bathrooms: Array<{
    type: "full" | "half";
    tub_action: "none" | "glaze" | "replace";
    toilet_replace: boolean;
    vanity_replace: boolean;
    vanity_light_replace: boolean;
    fan_replace: boolean;
  }>;
  flooring: { pct_replace: number; type_hint?: string };
  paint: { pct_paint: number };
  interior_doors: { damaged_count: number };
  roof: { needs_replacement: boolean; contradicted_by_photos: boolean };
  hvac: { severity: "ok" | "repair" | "replace"; contradicted_by_photos: boolean };
  water_heater: { needs_replacement: boolean; contradicted_by_photos: boolean };
  appliances_missing: Array<"stove" | "fridge" | "microwave" | "dishwasher">;
  plumbing_stack: { failure_evidence: boolean };
  electrical: { panel_replace_needed: boolean };
  foundation: { vertical_crack_count: number; lateral_movement: boolean };
  basement: { drain_tile_needed: boolean; packed_with_contents: boolean };
  cleanout: {
    dumpsters_estimate: number;
    hoarder_level: "none" | "light" | "medium" | "heavy";
    packed_basement: boolean;
  };
  landscaping: { scope: "none" | "light" | "overgrown" | "severe" };
  windows: { replacement_count: number };
  exterior: {
    siding_replace_pct: number; // 0..1 of house sqft
    gutters_replace: boolean;
    garage_door_replace: boolean;
    driveway_overlay: boolean;
  };
  gut_rehab_severity: "none" | "partial" | "high";
  remarks_signals: {
    new_roof: boolean;
    new_hvac: boolean;
    new_furnace: boolean;
    new_water_heater: boolean;
    cash_only: boolean;
    full_rehab: boolean;
    no_utilities: boolean;
    sewer_problem: boolean;
  };
}

export interface LineItems {
  kitchen: number;
  baths: number;
  flooring: number;
  paint_drywall: number; // whole-house paint package (label retained for back-compat)
  interior_doors: number;
  roof: number;
  hvac: number;
  water_heater: number;
  electrical_panel: number;
  appliances: number;
  plumbing_stack: number;
  foundation_reserve: number;
  basement_reserve: number;
  cleanout: number;
  landscaping: number;
  windows: number;
  siding: number;
  gutters: number;
  garage_door: number;
  driveway: number;
  misc: number; // 10% of subtotal
  gut_rehab: number;
}

export interface PriceResult {
  line_items: LineItems;
  total: number;
  gut_rehab_mode: boolean;
}

export const REPAIR_LINE_LABELS: Record<keyof LineItems, string> = {
  kitchen: "Kitchen",
  baths: "Bathrooms",
  flooring: "Flooring",
  paint_drywall: "Interior Paint",
  interior_doors: "Interior Doors",
  roof: "Roof",
  hvac: "HVAC",
  water_heater: "Water Heater",
  electrical_panel: "Electrical Panel",
  appliances: "Appliances",
  plumbing_stack: "Plumbing Stack",
  foundation_reserve: "Foundation",
  basement_reserve: "Drain Tile / Basement",
  cleanout: "Cleanout / Dumpsters",
  landscaping: "Landscaping",
  windows: "Windows",
  siding: "Siding",
  gutters: "Gutters",
  garage_door: "Garage Door",
  driveway: "Driveway",
  misc: "Misc Reserve (10%)",
  gut_rehab: "Gut Rehab",
};

function clamp01(n: number): number {
  if (!isFinite(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function emptyLineItems(): LineItems {
  return {
    kitchen: 0, baths: 0, flooring: 0, paint_drywall: 0, interior_doors: 0,
    roof: 0, hvac: 0, water_heater: 0, electrical_panel: 0, appliances: 0,
    plumbing_stack: 0, foundation_reserve: 0, basement_reserve: 0, cleanout: 0,
    landscaping: 0, windows: 0, siding: 0, gutters: 0, garage_door: 0,
    driveway: 0, misc: 0, gut_rehab: 0,
  };
}

export function priceRepairs(
  obs: Observations,
  sqft: number,
  mlsBaths: number,
  rules: PricingRules,
): PriceResult {
  const li = emptyLineItems();
  const safeSqft = Math.max(0, sqft || 0);

  // Foundation / basement / electrical reserves apply in both modes
  const vCount = Math.max(0, Math.round(obs.foundation?.vertical_crack_count ?? 0));
  li.foundation_reserve =
    vCount * rules.foundation_vertical_crack_each +
    (obs.foundation?.lateral_movement ? rules.foundation_lateral_replace : 0);
  li.basement_reserve = obs.basement?.drain_tile_needed ? rules.drain_tile_system : 0;
  li.electrical_panel = obs.electrical?.panel_replace_needed ? rules.electrical_panel_replace : 0;

  // Cleanout always applies (min 1 dumpster)
  const dumpsters = Math.max(1, Math.min(20, Math.round(obs.cleanout?.dumpsters_estimate ?? 1)));
  li.cleanout = dumpsters * rules.dumpster_each;

  // GUT REHAB BRANCH — supersedes most line items; keep reserves + cleanout
  const gutMode = obs.gut_rehab_severity === "high";
  if (gutMode) {
    li.gut_rehab = Math.round(safeSqft * rules.gut_per_sqft_high);
    const subtotal =
      li.gut_rehab + li.foundation_reserve + li.basement_reserve +
      li.electrical_panel + li.cleanout;
    li.misc = Math.round(subtotal * rules.misc_reserve_pct);
    return { line_items: li, total: sum(li), gut_rehab_mode: true };
  }

  // KITCHEN
  const k = obs.kitchen ?? { condition: "good", scope: "keep" };
  const cab = Math.max(0, Math.round(k.cabinet_count_estimate ?? 0));
  if (k.scope === "replace" || k.condition === "damaged" || k.condition === "missing") {
    li.kitchen = cab > 0
      ? cab * rules.cabinet_replace_each + rules.countertop_replace_kitchen
      : rules.kitchen_fallback_replace;
  } else if (k.scope === "light" || k.condition === "dated_oak") {
    const paint = cab > 0 ? cab * rules.cabinet_paint_each : 800;
    li.kitchen = paint + rules.countertop_replace_kitchen + rules.kitchen_light_fixtures;
  }

  // BATHROOMS — per-fixture, capped by MLS bath count
  const capped = (obs.bathrooms ?? []).slice(0, Math.max(0, Math.ceil(mlsBaths || 0)));
  for (const b of capped) {
    if (b.tub_action === "glaze") li.baths += rules.bath_tub_glaze;
    else if (b.tub_action === "replace") li.baths += rules.bath_tub_replace;
    if (b.toilet_replace) li.baths += rules.bath_toilet_replace;
    if (b.vanity_replace) li.baths += rules.bath_vanity_replace;
    if (b.vanity_light_replace) li.baths += rules.bath_vanity_light;
    if (b.fan_replace) li.baths += rules.bath_fan;
  }

  // FLOORING (whole-house paint/flooring handled here, not duplicated in bath)
  li.flooring = Math.round(safeSqft * clamp01(obs.flooring?.pct_replace ?? 0) * rules.flooring_per_sqft);

  // INTERIOR PAINT (whole-house package)
  li.paint_drywall = Math.round(safeSqft * clamp01(obs.paint?.pct_paint ?? 0) * rules.paint_per_sqft);

  // INTERIOR DOORS
  const doorCount = Math.max(0, Math.min(30, Math.round(obs.interior_doors?.damaged_count ?? 0)));
  li.interior_doors = doorCount * rules.interior_door_each;

  // ROOF — sqft / 100 * 1.25 * $/square; respect "new roof" remark unless contradicted
  const newRoof = obs.remarks_signals?.new_roof && !obs.roof?.contradicted_by_photos;
  if (obs.roof?.needs_replacement && !newRoof) {
    const squares = (safeSqft / 100) * rules.roof_overhead_multiplier;
    li.roof = Math.round(squares * rules.roof_per_square);
  }

  // HVAC
  const newHvacRemark =
    (obs.remarks_signals?.new_hvac || obs.remarks_signals?.new_furnace) &&
    !obs.hvac?.contradicted_by_photos;
  if (obs.hvac?.severity === "replace" && !newHvacRemark) li.hvac = rules.hvac_replace;
  else if (obs.hvac?.severity === "repair" && !newHvacRemark) li.hvac = rules.hvac_repair_reserve;

  // WATER HEATER
  const newWh = obs.remarks_signals?.new_water_heater && !obs.water_heater?.contradicted_by_photos;
  if (obs.water_heater?.needs_replacement && !newWh) li.water_heater = rules.water_heater_replace;

  // APPLIANCES
  for (const a of new Set(obs.appliances_missing ?? [])) {
    li.appliances += rules.appliances[a] ?? 0;
  }

  // PLUMBING STACK
  if (obs.plumbing_stack?.failure_evidence) li.plumbing_stack = rules.plumbing_stack_replace;

  // WINDOWS
  const winCount = Math.max(0, Math.min(60, Math.round(obs.windows?.replacement_count ?? 0)));
  li.windows = winCount * rules.window_each;

  // LANDSCAPING
  const ls = obs.landscaping?.scope ?? "none";
  if (ls === "light") li.landscaping = rules.landscaping_light;
  else if (ls === "overgrown") li.landscaping = rules.landscaping_overgrown;
  else if (ls === "severe") li.landscaping = rules.landscaping_severe;

  // EXTERIOR
  const sidingPct = clamp01(obs.exterior?.siding_replace_pct ?? 0);
  li.siding = Math.round(safeSqft * sidingPct * rules.siding_per_sqft);
  li.gutters = obs.exterior?.gutters_replace ? rules.gutters_replace : 0;
  li.garage_door = obs.exterior?.garage_door_replace ? rules.garage_door_replace : 0;
  li.driveway = obs.exterior?.driveway_overlay ? rules.driveway_overlay : 0;

  // MISC = 10% of subtotal of all other lines
  const subtotal = sum(li); // misc + gut_rehab are still 0 here
  li.misc = Math.round(subtotal * rules.misc_reserve_pct);

  return { line_items: li, total: sum(li), gut_rehab_mode: false };
}

function sum(li: LineItems): number {
  return Object.values(li).reduce((a, b) => a + (Number(b) || 0), 0);
}

export const ENGINE_VERSION = "repair-engine-v2";
