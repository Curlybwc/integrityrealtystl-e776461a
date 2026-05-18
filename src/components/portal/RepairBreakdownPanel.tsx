import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/screening";
import { REPAIR_LINE_LABELS, type LineItems } from "@/lib/repairPricing";
import type { RepairAnalysisRow } from "@/lib/repairAnalysis";

interface Props {
  row: RepairAnalysisRow | null;
  isLoading?: boolean;
}

const RepairBreakdownPanel = ({ row, isLoading }: Props) => {
  if (!row && isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Repair Analysis</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </CardContent>
      </Card>
    );
  }

  if (!row) {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Repair Analysis</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No MLS listing linked — open this analyzer from a search result to run repair analysis.
        </CardContent>
      </Card>
    );
  }

  const { analysis_status, line_items, total_repair_estimate, gut_rehab_mode, overridden_at, overridden_by } = row;

  if (analysis_status === "pending" || analysis_status === "analyzing") {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Repair Analysis</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Repair Analysis Pending — MAO and deal metrics will appear once analysis completes.
        </CardContent>
      </Card>
    );
  }

  if (analysis_status === "quota_blocked") {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Repair Analysis</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="w-4 h-4" />
          You've reached your monthly AI analysis limit. Contact support to request an increase.
        </CardContent>
      </Card>
    );
  }

  if (analysis_status === "failed") {
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Repair Analysis</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          Repair analysis failed. {row.failure_reason ?? ""}
        </CardContent>
      </Card>
    );
  }

  // complete
  const items = (line_items ?? {}) as LineItems;
  const total = total_repair_estimate ?? 0;
  const ordered = (Object.keys(REPAIR_LINE_LABELS) as Array<keyof LineItems>)
    .filter((k) => (items?.[k] ?? 0) > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            Repair Analysis
          </span>
          <span className="flex items-center gap-2">
            {gut_rehab_mode && <Badge variant="destructive" className="text-xs">Gut Rehab Mode</Badge>}
            {overridden_at && <Badge variant="secondary" className="text-xs">Admin Override</Badge>}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">Total Repair Estimate</span>
          <span className="font-mono text-lg font-semibold text-primary">{formatCurrency(total)}</span>
        </div>
        <div className="border-t pt-2 space-y-1">
          {ordered.length === 0 && (
            <p className="text-xs text-muted-foreground">No line items above $0.</p>
          )}
          {ordered.map((k) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{REPAIR_LINE_LABELS[k]}</span>
              <span className="font-mono">{formatCurrency(items[k]!)}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground pt-1">
          Rent-ready investor-grade estimate. Pricing v{row.pricing_version} · {row.engine_version}
        </p>
      </CardContent>
    </Card>
  );
};

export default RepairBreakdownPanel;
