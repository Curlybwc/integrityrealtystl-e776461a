// Saved deals — investor-owned snapshot underwriting workspaces
// Snapshot-copy model: saved underwriting must survive MLS / admin changes.

import type { Deal } from "./screening";
import type { LineItems } from "./repairPricing";
import { REPAIR_LINE_LABELS } from "./repairPricing";

export interface SavedUnderwriting {
  arv: number;
  expected_rent: number;
  total_repairs: number;
  repair_breakdown: LineItems | null;
  mao: number;
  rent_to_price_pct: number;
  all_in_pct_of_arv: number;
}

export interface SavedDeal {
  id: string;
  user_id: string;
  property_key: string;
  source_type: string;
  source_tags: string[];
  mls_listing_id: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: string | null;
  list_price_at_save: number | null;
  remarks_snapshot: string | null;
  photo_urls: string[];
  underwriting: SavedUnderwriting;
  notes: string | null;
  evidence_hash_at_save: string | null;
  saved_at: string;
  updated_at: string;
}

export type SavedDealSnapshot = Omit<SavedDeal, "id" | "user_id" | "saved_at" | "updated_at">;

const FLIP_MAX_ARV_PCT = 0.75;

/** Central metrics math (same formulas as screening.ts; price + repairs basis). */
export function recomputeMetrics(
  list_price: number,
  arv: number,
  expected_rent: number,
  total_repairs: number,
): Pick<SavedUnderwriting, "mao" | "rent_to_price_pct" | "all_in_pct_of_arv"> {
  const all_in = (list_price || 0) + (total_repairs || 0);
  const mao = arv > 0 ? arv * FLIP_MAX_ARV_PCT - total_repairs : 0;
  const rent_to_price_pct = all_in > 0 ? (expected_rent || 0) / all_in : 0;
  const all_in_pct_of_arv = arv > 0 ? all_in / arv : 0;
  return { mao, rent_to_price_pct, all_in_pct_of_arv };
}

export function emptyLineItems(): LineItems {
  return Object.fromEntries(
    Object.keys(REPAIR_LINE_LABELS).map((k) => [k, 0]),
  ) as unknown as LineItems;
}

export function sumLineItems(items: LineItems | null | undefined): number {
  if (!items) return 0;
  return Object.values(items).reduce((a, b) => a + (Number(b) || 0), 0);
}

/** Derive a stable property_key for a live Deal. */
export function propertyKeyForDeal(deal: Pick<Deal, "id" | "source_type" | "mls_listing_id">): string {
  if (deal.mls_listing_id) return `mls:${deal.mls_listing_id}`;
  return `${deal.source_type === "WHOLESALER" ? "wholesale" : "deal"}:${deal.id}`;
}

export function sourceTagsForDeal(deal: Pick<Deal, "source_type" | "flagged_for_alert">): string[] {
  const tags: string[] = [];
  if (deal.source_type === "WHOLESALER") tags.push("Wholesale Deal");
  else tags.push("MLS Deal");
  if (deal.flagged_for_alert) tags.push("Deal Alert");
  return tags;
}

/** Build a snapshot from a live Deal + the investor's current underwriting state. */
export function buildSnapshotFromDeal(
  deal: Deal,
  underwriting: SavedUnderwriting,
  opts: { notes?: string | null; remarks?: string | null; evidenceHash?: string | null } = {},
): SavedDealSnapshot {
  return {
    property_key: propertyKeyForDeal(deal),
    source_type: deal.source_type,
    source_tags: sourceTagsForDeal(deal),
    mls_listing_id: deal.mls_listing_id ?? null,
    address: deal.address,
    city: deal.city,
    state: deal.state,
    zip: deal.zip,
    beds: deal.beds ?? null,
    baths: deal.baths ?? null,
    sqft: deal.sqft ?? null,
    year_built: deal.year_built ?? null,
    property_type: deal.property_type ?? null,
    list_price_at_save: deal.list_price ?? null,
    remarks_snapshot: opts.remarks ?? null,
    photo_urls: deal.photo_urls ?? [],
    underwriting,
    notes: opts.notes ?? null,
    evidence_hash_at_save: opts.evidenceHash ?? null,
  };
}

const APPROX = 0.5; // dollar tolerance
function approxEqual(a: number, b: number) {
  return Math.abs((a || 0) - (b || 0)) < APPROX;
}

export function diffUnderwriting(
  current: SavedUnderwriting,
  saved: SavedUnderwriting,
): { changed: boolean; fields: string[] } {
  const fields: string[] = [];
  if (!approxEqual(current.arv, saved.arv)) fields.push("arv");
  if (!approxEqual(current.expected_rent, saved.expected_rent)) fields.push("expected_rent");
  if (!approxEqual(current.total_repairs, saved.total_repairs)) fields.push("total_repairs");
  const a = current.repair_breakdown ?? null;
  const b = saved.repair_breakdown ?? null;
  if ((a && !b) || (!a && b)) fields.push("repair_breakdown");
  else if (a && b) {
    for (const k of Object.keys(REPAIR_LINE_LABELS) as Array<keyof LineItems>) {
      if (!approxEqual(Number(a[k] ?? 0), Number(b[k] ?? 0))) {
        fields.push("repair_breakdown");
        break;
      }
    }
  }
  return { changed: fields.length > 0, fields };
}
