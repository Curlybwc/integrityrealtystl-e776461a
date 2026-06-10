import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnalyzerTool = "analyzer" | "mls_search" | "comp_arv";

export function useAnalyzerQuota() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setRemaining(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.rpc("get_preview_runs_remaining", { _user_id: uid });
    if (!error && typeof data === "number") {
      setRemaining(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Records a tool run. Returns true if allowed; false if quota exhausted.
   * Server-side enforced via get_access_tier — if tier is browse/full this is a no-op (always allowed).
   */
  const recordRun = useCallback(
    async (tool: AnalyzerTool, context: Record<string, unknown> = {}): Promise<boolean> => {
      if (!userId) return false;
      // If unlimited, allow without inserting
      if (remaining !== null && remaining >= 999999) return true;
      if (remaining !== null && remaining <= 0) return false;

      const { error } = await supabase
        .from("analyzer_usage")
        .insert({ user_id: userId, tool, context } as never);
      // Even if insert fails (RLS), tier server-side will still gate sensitive actions
      if (error) {
        console.warn("analyzer_usage insert failed", error.message);
      }
      await load();
      return true;
    },
    [userId, remaining, load]
  );

  const isUnlimited = remaining !== null && remaining >= 999999;
  const isExhausted = remaining !== null && !isUnlimited && remaining <= 0;

  return { remaining, isUnlimited, isExhausted, loading, recordRun, refresh: load };
}
