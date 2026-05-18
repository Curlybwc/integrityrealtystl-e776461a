import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchActiveAnalysis,
  requestRepairAnalysis,
  type RepairAnalysisRow,
} from "@/lib/repairAnalysis";

interface UseRepairAnalysisOpts {
  mlsListingId: string | null | undefined;
  autoEnqueue?: boolean; // default true: if no row found, call analyze-repairs
  source?: "user" | "admin" | "system_core";
}

export function useRepairAnalysis({ mlsListingId, autoEnqueue = true, source = "user" }: UseRepairAnalysisOpts) {
  const [row, setRow] = useState<RepairAnalysisRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load + enqueue
  useEffect(() => {
    if (!mlsListingId) {
      setRow(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const existing = await fetchActiveAnalysis(mlsListingId);
      if (cancelled) return;
      if (existing) {
        setRow(existing);
        setIsLoading(false);
        return;
      }
      if (autoEnqueue) {
        const created = await requestRepairAnalysis(mlsListingId, source);
        if (!cancelled && created) setRow(created);
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [mlsListingId, autoEnqueue, source]);

  // Realtime subscription: any update to active row for this mlsId
  useEffect(() => {
    if (!mlsListingId) return;
    const channel = supabase
      .channel(`repair-analysis-${mlsListingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "repair_analyses",
          filter: `mls_listing_id=eq.${mlsListingId}`,
        },
        (payload) => {
          const next = payload.new as RepairAnalysisRow | undefined;
          if (next && next.is_active) setRow(next);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mlsListingId]);

  const refetch = useCallback(async () => {
    if (!mlsListingId) return;
    const r = await fetchActiveAnalysis(mlsListingId);
    if (r) setRow(r);
  }, [mlsListingId]);

  return { row, isLoading, refetch };
}
