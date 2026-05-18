import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CompArvResult, CompTier, ScoredComp } from "@/types/compArv";

const tierColor: Record<CompTier, string> = {
  Strong: "bg-green-600 text-white",
  Good: "bg-blue-600 text-white",
  Fallback: "bg-amber-500 text-white",
  WeakSupport: "bg-muted text-muted-foreground",
  Excluded: "bg-destructive/20 text-destructive",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  result: CompArvResult;
  onToggleComp?: (id: string, include: boolean) => void;
}

const CompRow = ({ c, onToggle }: { c: ScoredComp; onToggle?: (id: string, v: boolean) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-xs border-b border-border">
        <CollapsibleTrigger asChild>
          <button className="col-span-4 text-left font-medium truncate hover:text-primary">
            {c.comp.address || c.comp.id}
          </button>
        </CollapsibleTrigger>
        <span className="col-span-1">{c.distanceMi === Infinity ? "—" : `${c.distanceMi.toFixed(2)}mi`}</span>
        <span className="col-span-1">{c.comp.beds}/{c.comp.baths}</span>
        <span className="col-span-1">{c.comp.sqft || "—"}</span>
        <span className="col-span-2 font-mono">{fmt(c.comp.soldPrice)}</span>
        <span className="col-span-2 font-mono text-foreground">{fmt(c.adjustments.adjustedValue)}</span>
        <span className="col-span-1 flex items-center justify-end gap-1">
          <Badge className={tierColor[c.tier]}>{c.tier[0]}</Badge>
          {c.reviewFlags.length > 0 && <span title="Review flags" className="text-amber-500">⚑</span>}
          {onToggle && c.excludeReason == null && (
            <input
              type="checkbox"
              checked={c.included}
              onChange={(e) => onToggle(c.comp.id, e.target.checked)}
              className="ml-1"
            />
          )}
        </span>
      </div>
      <CollapsibleContent>
        <div className="px-6 py-2 text-xs bg-muted/30 grid grid-cols-2 gap-x-6 gap-y-1">
          <div><b>Score:</b> {c.score.total.toFixed(0)} (dist {c.score.distance.toFixed(0)}, school {c.score.schoolDistrict}, sub {c.score.subdivision}, beds {c.score.beds}, baths {c.score.baths}, sqft {c.score.sqft.toFixed(0)}, style {c.score.style}, recency {c.score.recency.toFixed(0)}, cond {c.score.condition}, util {c.score.utility})</div>
          <div><b>Penalties:</b> −{c.score.penalties}</div>
          <div><b>Adjustments:</b> sqft {fmt(c.adjustments.sqft)}, beds {fmt(c.adjustments.beds)}, baths {fmt(c.adjustments.baths)}, garage {fmt(c.adjustments.garage)}, basement {fmt(c.adjustments.basement)}, time {fmt(c.adjustments.time)}, condition {fmt(c.adjustments.condition)}</div>
          <div><b>Sold:</b> {c.comp.soldDate?.slice(0, 10) || "—"} · {c.comp.subdivision || "—"} · {c.comp.schoolDistrict || "—"}</div>
          {c.fallbackStepsUsed.length > 0 && <div className="col-span-2"><b>Fallback:</b> {c.fallbackStepsUsed.join(", ")}</div>}
          {c.reviewFlags.length > 0 && <div className="col-span-2 text-amber-600"><b>Review:</b> {c.reviewFlags.join(", ")}</div>}
          {c.excludeReason && <div className="col-span-2 text-destructive"><b>Excluded:</b> {c.excludeReason}</div>}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const CompArvPanel = ({ result, onToggleComp }: Props) => {
  const [showExcluded, setShowExcluded] = useState(false);
  const tc = result.tierCounts;

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap text-xs">
          <span className="font-medium">Tiers:</span>
          <Badge className={tierColor.Strong}>Strong {tc.Strong}</Badge>
          <Badge className={tierColor.Good}>Good {tc.Good}</Badge>
          <Badge className={tierColor.Fallback}>Fallback {tc.Fallback}</Badge>
          <Badge variant="outline">Weak {tc.WeakSupport}</Badge>
          <Badge variant="outline">Excluded {tc.Excluded}</Badge>
          <span className="ml-auto">Driver: <b>{result.driverTier}</b></span>
        </div>

        {result.arv && (
          <div className="px-4 py-3 border-b border-border grid grid-cols-3 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Conservative</div><div className="font-mono">{fmt(result.arv.conservative)}</div></div>
            <div><div className="text-xs text-muted-foreground">Likely</div><div className="font-mono font-semibold text-primary">{fmt(result.arv.likely)}</div></div>
            <div><div className="text-xs text-muted-foreground">Aggressive</div><div className="font-mono">{fmt(result.arv.aggressive)}</div></div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
          <span className="col-span-4">Address</span>
          <span className="col-span-1">Dist</span>
          <span className="col-span-1">Bd/Ba</span>
          <span className="col-span-1">Sqft</span>
          <span className="col-span-2">Sold</span>
          <span className="col-span-2">Adjusted</span>
          <span className="col-span-1 text-right">Tier</span>
        </div>
        {result.comps.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No qualifying comps.</div>
        )}
        {result.comps.map((c) => <CompRow key={c.comp.id} c={c} onToggle={onToggleComp} />)}

        {result.excluded.length > 0 && (
          <div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setShowExcluded(!showExcluded)}>
              {showExcluded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
              Excluded ({result.excluded.length})
            </Button>
            {showExcluded && result.excluded.map((c) => <CompRow key={c.comp.id} c={c} />)}
          </div>
        )}

        {result.drivers.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-xs">
            <div className="font-medium mb-1">Confidence drivers ({result.confidence}/100 · {result.confidenceBand})</div>
            <ul className="space-y-0.5 text-muted-foreground">
              {result.drivers.map((d, i) => (
                <li key={i}>{d.delta !== 0 && <span className="font-mono mr-1">{d.delta > 0 ? "+" : ""}{d.delta}</span>}{d.label}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompArvPanel;
