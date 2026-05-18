import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildCompArv, recomputeWithOverrides } from "@/lib/compArv";
import type { CompArvResult, LocalOverrides, Subject } from "@/types/compArv";

export function useCompArv() {
  const [result, setResult] = useState<CompArvResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSubjectKey = useRef<string>("");

  const run = useCallback(async (subject: Subject) => {
    const key = JSON.stringify({
      zip: subject.zip, beds: subject.beds, baths: subject.baths,
      sqft: subject.sqft, lat: subject.lat, long: subject.long,
    });
    if (key === lastSubjectKey.current && result) return result;
    if (!subject.zip || !subject.sqft || subject.sqft <= 0) return null;

    lastSubjectKey.current = key;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("fetch-comp-arv", {
        body: { subject },
      });
      if (fnErr) throw fnErr;
      setResult(data as CompArvResult);
      return data as CompArvResult;
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [result]);

  const recompute = useCallback((overrides: LocalOverrides) => {
    if (!result) return;
    // Re-run engine locally with current comps + overrides
    const allComps = [...result.comps, ...result.excluded].map((s) => s.comp);
    const next = buildCompArv(result.subject, allComps, overrides);
    setResult(next);
  }, [result]);

  const reset = useCallback(() => {
    lastSubjectKey.current = "";
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, run, recompute, reset };
}
