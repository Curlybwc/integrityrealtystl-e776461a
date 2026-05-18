import { Loader2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SnapshotStatus, SubjectDiff } from "@/lib/compReports";
import type { CompArvResult } from "@/types/compArv";

const STATUS_LABEL: Record<SnapshotStatus, string> = {
  current: "Current",
  aging: "Aging",
  refresh_recommended: "Refresh recommended",
  closed: "Closed",
};

const STATUS_CLASS: Record<SnapshotStatus, string> = {
  current: "bg-emerald-100 text-emerald-800 border-emerald-200",
  aging: "bg-amber-100 text-amber-800 border-amber-200",
  refresh_recommended: "bg-red-100 text-red-800 border-red-200",
  closed: "bg-muted text-muted-foreground border-border",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d <= 0) {
    const h = Math.floor(ms / 3600000);
    if (h <= 0) return "just now";
    return `${h}h ago`;
  }
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  result: CompArvResult | null;
  refreshedAt: string | null;
  engineVersion: string | null;
  status: SnapshotStatus;
  isLoading: boolean;
  isRefreshing: boolean;
  drift: SubjectDiff[];
  manualArvOverride: boolean;
  showComps: boolean;
  onToggleComps: () => void;
  onRefresh: () => void;
}

export default function CompReportStatus(props: Props) {
  const {
    result, refreshedAt, engineVersion, status,
    isLoading, isRefreshing, drift, manualArvOverride,
    showComps, onToggleComps, onRefresh,
  } = props;

  const closed = status === "closed";
  const hasDrift = drift.length > 0;
  const refreshDisabled = isRefreshing || isLoading;

  const refreshBtn = (
    <Button
      variant={hasDrift ? "default" : "outline"}
      size="sm"
      className={`h-7 text-xs ${closed ? "opacity-60" : ""} ${hasDrift ? "ring-2 ring-amber-400 animate-pulse" : ""}`}
      onClick={onRefresh}
      disabled={refreshDisabled}
    >
      {isRefreshing
        ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        : <RefreshCw className="w-3 h-3 mr-1" />}
      Refresh comps
    </Button>
  );

  return (
    <div className="space-y-2">
      {hasDrift && !isRefreshing && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">
              Subject details changed ({drift.map((d) => String(d.field)).join(", ")}) — Refresh comps to recalculate ARV.
            </div>
            <details className="mt-1">
              <summary className="cursor-pointer text-xs underline">View what changed</summary>
              <ul className="mt-1 text-xs space-y-0.5">
                {drift.map((d) => (
                  <li key={String(d.field)}>
                    <span className="font-mono">{String(d.field)}</span>:{" "}
                    <span className="line-through opacity-70">{String(d.oldValue ?? "—")}</span>
                    {" → "}
                    <span className="font-semibold">{String(d.newValue ?? "—")}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="py-3 flex flex-wrap items-center gap-3 text-sm">
          {(isLoading || isRefreshing) && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRefreshing ? "Refreshing comps…" : "Loading saved snapshot…"}
            </span>
          )}
          {result && (
            <>
              <span>
                <span className="text-muted-foreground">System ARV:</span>{" "}
                <span className="font-mono font-semibold text-primary">
                  {result.arv ? formatCurrency(result.arv.likely) : "—"}
                </span>
              </span>
              <Badge variant="outline">
                Confidence {result.confidence} · {result.confidenceBand}
              </Badge>
              <Badge variant="secondary">
                Source: {result.arv ? "Comps" : "Heuristic"}
              </Badge>
              {manualArvOverride && (
                <Badge className="bg-amber-500 text-white">User ARV driving screening</Badge>
              )}
            </>
          )}

          {refreshedAt && (
            <span className="text-xs text-muted-foreground">
              Last refreshed {timeAgo(refreshedAt)}
              {engineVersion ? ` · engine v${engineVersion}` : ""}
            </span>
          )}

          {refreshedAt && (
            <Badge variant="outline" className={STATUS_CLASS[status]}>
              {STATUS_LABEL[status]}
            </Badge>
          )}

          <div className="ml-auto flex items-center gap-2">
            {closed ? (
              <Tooltip>
                <TooltipTrigger asChild>{refreshBtn}</TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    This property is closed — viewing historical snapshot. Refresh anyway?
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              refreshBtn
            )}
            {result && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={onToggleComps}
              >
                {showComps ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                {showComps ? "Hide" : "Show"} comps
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
