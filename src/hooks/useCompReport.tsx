// Orchestrates persistent comp-ARV snapshots for a property.
// - Loads the shared active snapshot
// - If missing, runs the engine via fetch-comp-arv and persists it
// - Applies the current user's overrides (debounced persistence)
// - Detects subject drift from the persisted subject

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildCompArv } from "@/lib/compArv";
import {
  computeSnapshotStatus,
  diffSubject,
  getActiveReport,
  getUserOverrides,
  saveNewSnapshot,
  upsertOverrides,
  type CompReportRow,
  type SnapshotStatus,
  type SubjectDiff,
} from "@/lib/compReports";
import type { CompArvResult, LocalOverrides, Subject } from "@/types/compArv";

interface UseCompReportArgs {
  propertyKey: string | null;
  mlsId?: string | null;
  address?: string | null;
  zip?: string | null;
  subject: Subject | null;     // live subject from analyzer
}

export interface UseCompReportReturn {
  report: CompReportRow | null;
  overrides: LocalOverrides;
  result: CompArvResult | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  status: SnapshotStatus;
  drift: SubjectDiff[];
  refresh: () => Promise<void>;
  setOverrides: (next: LocalOverrides) => void;
}

const DEBOUNCE_MS = 800;

export function useCompReport(args: UseCompReportArgs): UseCompReportReturn {
  const { propertyKey, mlsId, address, zip, subject } = args;

  const [report, setReport] = useState<CompReportRow | null>(null);
  const [overrides, setOverridesState] = useState<LocalOverrides>({});
  const [result, setResult] = useState<CompArvResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<number | null>(null);
  const pendingOverrides = useRef<LocalOverrides | null>(null);
  const loadedKey = useRef<string | null>(null);

  // ---------- engine runner ----------
  const runEngineAndPersist = useCallback(async (): Promise<CompReportRow | null> => {
    if (!propertyKey || !subject) return null;
    setIsRefreshing(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("fetch-comp-arv", {
        body: { subject },
      });
      if (fnErr) throw fnErr;
      const fresh = data as CompArvResult;
      const saved = await saveNewSnapshot({
        propertyKey,
        mlsId: mlsId ?? null,
        address: address ?? null,
        zip: zip ?? subject.zip ?? null,
        subject,
        searchCriteria: { zip: subject.zip, beds: subject.beds, baths: subject.baths, sqft: subject.sqft },
        result: fresh,
      });
      if (saved) {
        setReport(saved);
        setResult(saved.result);
        // Reset overrides for the new report (per-user blank by default)
        setOverridesState({});
      } else {
        // Still surface result even if persistence failed (unauthenticated, etc.)
        setResult(fresh);
      }
      return saved;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [propertyKey, subject, mlsId, address, zip]);

  // ---------- initial load ----------
  useEffect(() => {
    if (!propertyKey || !subject) return;
    if (loadedKey.current === propertyKey) return;
    loadedKey.current = propertyKey;

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const existing = await getActiveReport(propertyKey);
        if (cancelled) return;
        if (existing) {
          setReport(existing);
          const userOv = await getUserOverrides(existing.id);
          if (cancelled) return;
          const ov = userOv?.overrides ?? {};
          setOverridesState(ov);
          // Recompute locally with overrides so the included flags reflect this user
          const allComps = [...existing.result.comps, ...existing.result.excluded].map((s) => s.comp);
          setResult(buildCompArv(existing.subject, allComps, ov));
        } else {
          await runEngineAndPersist();
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [propertyKey, subject, runEngineAndPersist]);

  // ---------- overrides: instant local recompute + debounced persist ----------
  const flushOverrides = useCallback(() => {
    if (!report || !pendingOverrides.current) return;
    const toSave = pendingOverrides.current;
    pendingOverrides.current = null;
    void upsertOverrides({ reportId: report.id, overrides: toSave });
  }, [report]);

  const setOverrides = useCallback((next: LocalOverrides) => {
    setOverridesState(next);
    if (report) {
      const allComps = [...report.result.comps, ...report.result.excluded].map((s) => s.comp);
      setResult(buildCompArv(report.subject, allComps, next));
      pendingOverrides.current = next;
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      debounceTimer.current = window.setTimeout(flushOverrides, DEBOUNCE_MS);
    }
  }, [report, flushOverrides]);

  // Flush on unmount + beforeunload
  useEffect(() => {
    const onUnload = () => flushOverrides();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
      flushOverrides();
    };
  }, [flushOverrides]);

  // ---------- derived ----------
  const status: SnapshotStatus = useMemo(
    () => report ? computeSnapshotStatus(report.refreshed_at, report.status) : "current",
    [report],
  );

  const drift: SubjectDiff[] = useMemo(
    () => (report && subject ? diffSubject(report.subject, subject) : []),
    [report, subject],
  );

  return {
    report,
    overrides,
    result,
    isLoading,
    isRefreshing,
    error,
    status,
    drift,
    refresh: runEngineAndPersist as unknown as () => Promise<void>,
    setOverrides,
  };
}
