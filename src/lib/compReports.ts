// Persistence layer for property-level comp-ARV snapshots.
// Shared snapshots in `comp_reports`; per-user overrides in `comp_report_overrides`.

import { supabase } from "@/integrations/supabase/client";
import type { CompArvResult, LocalOverrides, Subject } from "@/types/compArv";

export const ENGINE_VERSION = "1.0.0";
export const SCORING_VERSION = "1.0.0";

export type SnapshotStatus = "current" | "aging" | "refresh_recommended" | "closed";

export interface CompReportRow {
  id: string;
  property_key: string;
  mls_listing_id: string | null;
  address: string | null;
  zip: string | null;
  created_by: string;
  last_refreshed_by: string;
  status: string;
  is_active: boolean;
  engine_version: string | null;
  scoring_version: string | null;
  subject: Subject;
  search_criteria: Record<string, unknown> | null;
  result: CompArvResult;
  arv_conservative: number | null;
  arv_likely: number | null;
  arv_aggressive: number | null;
  confidence: number | null;
  confidence_band: string | null;
  driver_tier: string | null;
  included_comp_count: number;
  strong_comp_count: number;
  good_comp_count: number;
  fallback_comp_count: number;
  excluded_comp_count: number;
  fallback_used: boolean;
  refreshed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserOverridesRow {
  id: string;
  report_id: string;
  user_id: string;
  overrides: LocalOverrides;
  notes: string | null;
  updated_at: string;
}

// ---------- property key ----------

function normalizeAddress(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[.,#]/g, "").trim();
}

async function sha1Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function derivePropertyKey(opts: {
  mlsId?: string | null;
  address?: string | null;
  zip?: string | null;
}): Promise<string | null> {
  if (opts.mlsId && opts.mlsId.trim()) return `mls:${opts.mlsId.trim()}`;
  if (opts.address && opts.zip) {
    const norm = `${normalizeAddress(opts.address)}|${opts.zip.trim()}`;
    return `addr:${await sha1Hex(norm)}`;
  }
  return null;
}

// ---------- status ----------

export function computeSnapshotStatus(refreshedAt: string, persisted: string): SnapshotStatus {
  if (persisted === "closed") return "closed";
  const ageDays = (Date.now() - new Date(refreshedAt).getTime()) / 86400000;
  if (ageDays > 45) return "refresh_recommended";
  if (ageDays > 14) return "aging";
  return "current";
}

// ---------- subject drift ----------

const DRIFT_FIELDS: (keyof Subject)[] = [
  "zip", "beds", "baths", "sqft", "yearBuilt",
  "subdivision", "schoolDistrict", "intendedFinish", "style", "stories",
];

export interface SubjectDiff {
  field: keyof Subject;
  oldValue: unknown;
  newValue: unknown;
}

export function diffSubject(saved: Subject, live: Subject): SubjectDiff[] {
  const diffs: SubjectDiff[] = [];
  for (const f of DRIFT_FIELDS) {
    const a = saved[f];
    const b = live[f];
    if ((a ?? null) !== (b ?? null)) diffs.push({ field: f, oldValue: a, newValue: b });
  }
  return diffs;
}

// ---------- read ----------

export async function getActiveReport(propertyKey: string): Promise<CompReportRow | null> {
  const { data, error } = await supabase
    .from("comp_reports")
    .select("*")
    .eq("property_key", propertyKey)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.warn("getActiveReport error:", error.message);
    return null;
  }
  return (data as unknown as CompReportRow) ?? null;
}

export async function getUserOverrides(reportId: string): Promise<UserOverridesRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("comp_report_overrides")
    .select("*")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.warn("getUserOverrides error:", error.message);
    return null;
  }
  return (data as unknown as UserOverridesRow) ?? null;
}

// ---------- summary projection ----------

function buildSummary(result: CompArvResult) {
  const tc = result.tierCounts;
  return {
    arv_conservative: result.arv?.conservative ?? null,
    arv_likely: result.arv?.likely ?? null,
    arv_aggressive: result.arv?.aggressive ?? null,
    confidence: result.confidence,
    confidence_band: result.confidenceBand,
    driver_tier: result.driverTier,
    included_comp_count: result.comps.filter((c) => c.included).length,
    strong_comp_count: tc.Strong ?? 0,
    good_comp_count: tc.Good ?? 0,
    fallback_comp_count: tc.Fallback ?? 0,
    excluded_comp_count: tc.Excluded ?? 0,
    fallback_used: (result.fallbackUsed?.length ?? 0) > 0,
  };
}

// ---------- write (controlled): insert-new + archive-previous ----------

export async function saveNewSnapshot(args: {
  propertyKey: string;
  mlsId?: string | null;
  address?: string | null;
  zip?: string | null;
  subject: Subject;
  searchCriteria?: Record<string, unknown>;
  result: CompArvResult;
}): Promise<CompReportRow | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("saveNewSnapshot: not signed in; skipping persistence");
    return null;
  }

  // 1) Archive the currently-active row (if any) BEFORE inserting the new one,
  //    so the partial-unique index doesn't collide. RLS only permits this
  //    specific flip (is_active true -> false, last_refreshed_by = me).
  const prev = await getActiveReport(args.propertyKey);
  if (prev) {
    const { error: archErr } = await supabase
      .from("comp_reports")
      .update({ is_active: false, last_refreshed_by: user.id })
      .eq("id", prev.id)
      .eq("is_active", true);
    if (archErr) {
      console.error("Failed to archive previous snapshot:", archErr.message);
      return null;
    }
  }

  const summary = buildSummary(args.result);
  const insertRow = {
    property_key: args.propertyKey,
    mls_listing_id: args.mlsId ?? null,
    address: args.address ?? null,
    zip: args.zip ?? null,
    created_by: user.id,
    last_refreshed_by: user.id,
    status: "current",
    is_active: true,
    engine_version: ENGINE_VERSION,
    scoring_version: SCORING_VERSION,
    subject: args.subject as unknown as Record<string, unknown>,
    search_criteria: args.searchCriteria ?? null,
    result: args.result as unknown as Record<string, unknown>,
    ...summary,
  };

  const { data, error } = await supabase
    .from("comp_reports")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    console.error("saveNewSnapshot insert failed:", error.message);
    return null;
  }
  return data as unknown as CompReportRow;
}

// Close (mark inactive) the active report for a property — used when the deal
// is moved to Sold/Pending/Removed. Stores final status='closed' on the row
// being archived. Fire-and-forget; failures are logged not thrown.
export async function closeReport(propertyKey: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const prev = await getActiveReport(propertyKey);
  if (!prev) return;
  const { error } = await supabase
    .from("comp_reports")
    .update({ is_active: false, status: "closed", last_refreshed_by: user.id })
    .eq("id", prev.id)
    .eq("is_active", true);
  if (error) console.warn("closeReport failed:", error.message);
}

// ---------- per-user overrides ----------

export async function upsertOverrides(args: {
  reportId: string;
  overrides: LocalOverrides;
  notes?: string | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("comp_report_overrides")
    .upsert(
      {
        report_id: args.reportId,
        user_id: user.id,
        overrides: args.overrides as unknown as Record<string, unknown>,
        notes: args.notes ?? null,
      },
      { onConflict: "report_id,user_id" },
    );
  if (error) console.warn("upsertOverrides failed:", error.message);
}
