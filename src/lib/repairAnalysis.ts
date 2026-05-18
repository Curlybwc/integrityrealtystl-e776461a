import { supabase } from "@/integrations/supabase/client";
import type { LineItems, Observations } from "./repairPricing";

export type AnalysisStatus = "pending" | "analyzing" | "complete" | "failed" | "quota_blocked";

export interface RepairAnalysisRow {
  id: string;
  mls_listing_id: string;
  evidence_hash: string;
  is_active: boolean;
  analysis_status: AnalysisStatus;
  observations: Observations | null;
  line_items: LineItems | null;
  total_repair_estimate: number | null;
  gut_rehab_mode: boolean;
  pricing_version: number | null;
  engine_version: string | null;
  model: string | null;
  photo_count_analyzed: number | null;
  evidence_snapshot: Record<string, unknown> | null;
  requested_by: string | null;
  priority: number;
  failure_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isAnalysisPending(row: RepairAnalysisRow | null | undefined): boolean {
  if (!row) return true;
  return row.analysis_status === "pending" || row.analysis_status === "analyzing";
}

export function isAnalysisComplete(row: RepairAnalysisRow | null | undefined): boolean {
  return row?.analysis_status === "complete" && row.total_repair_estimate != null;
}

export async function fetchActiveAnalysis(mlsListingId: string): Promise<RepairAnalysisRow | null> {
  const { data, error } = await supabase
    .from("repair_analyses")
    .select("*")
    .eq("mls_listing_id", mlsListingId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("fetchActiveAnalysis error", error);
    return null;
  }
  return (data as unknown as RepairAnalysisRow) ?? null;
}

export async function fetchActiveAnalysesBulk(mlsIds: string[]): Promise<Record<string, RepairAnalysisRow>> {
  if (mlsIds.length === 0) return {};
  const { data, error } = await supabase
    .from("repair_analyses")
    .select("*")
    .in("mls_listing_id", mlsIds)
    .eq("is_active", true);
  if (error) {
    console.error("fetchActiveAnalysesBulk error", error);
    return {};
  }
  const map: Record<string, RepairAnalysisRow> = {};
  for (const r of (data ?? []) as unknown as RepairAnalysisRow[]) {
    map[r.mls_listing_id] = r;
  }
  return map;
}

export async function requestRepairAnalysis(
  mlsListingId: string,
  source: "user" | "admin" | "system_core" = "user"
): Promise<RepairAnalysisRow | null> {
  const { data, error } = await supabase.functions.invoke("analyze-repairs", {
    body: { mlsListingId, source },
  });
  if (error) {
    console.error("requestRepairAnalysis error", error);
    return null;
  }
  return (data?.analysis as RepairAnalysisRow) ?? null;
}

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  monthKey: string;
}

export async function fetchQuotaState(): Promise<QuotaState | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) return null;
  const monthKey = new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from("ai_analysis_quota")
    .select("*")
    .eq("user_id", uid)
    .eq("month_key", monthKey)
    .maybeSingle();
  if (error) {
    console.error("fetchQuotaState error", error);
    return null;
  }
  const used = data?.count ?? 0;
  const limit = data?.monthly_limit ?? 200;
  return { used, limit, remaining: Math.max(0, limit - used), monthKey };
}
