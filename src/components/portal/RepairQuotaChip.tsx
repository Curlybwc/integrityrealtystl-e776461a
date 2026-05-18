import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchQuotaState, type QuotaState } from "@/lib/repairAnalysis";

/** Compact monthly AI repair-analysis quota indicator. */
const RepairQuotaChip = () => {
  const [quota, setQuota] = useState<QuotaState | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const q = await fetchQuotaState();
      if (!cancelled) setQuota(q);
    };
    load();
    const i = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  if (!quota) return null;
  const pct = quota.limit > 0 ? quota.used / quota.limit : 0;
  const tone =
    pct >= 1 ? "border-destructive text-destructive" :
    pct >= 0.8 ? "border-amber-500 text-amber-600" :
    "border-border text-muted-foreground";

  return (
    <Badge variant="outline" className={`gap-1 text-xs ${tone}`}>
      <Sparkles className="h-3 w-3" />
      AI repair analysis: {quota.used} / {quota.limit} this month
    </Badge>
  );
};

export default RepairQuotaChip;
