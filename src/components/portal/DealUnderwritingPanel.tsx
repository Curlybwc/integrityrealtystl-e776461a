import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Heart, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/screening";
import { REPAIR_LINE_LABELS, type LineItems } from "@/lib/repairPricing";
import {
  diffUnderwriting,
  emptyLineItems,
  recomputeMetrics,
  sumLineItems,
  type SavedDeal,
  type SavedDealSnapshot,
  type SavedUnderwriting,
} from "@/lib/savedDeals";
import { toast } from "@/hooks/use-toast";
import { useSavedDeals } from "@/hooks/useSavedDeals";

interface Props {
  listPrice: number;
  /** Initial underwriting baseline (from live Deal or from the saved record). */
  initial: SavedUnderwriting;
  /** Existing saved record for this property, if any. */
  savedRecord: SavedDeal | null;
  /** Build a snapshot from the current underwriting (for new saves). */
  buildSnapshot: (underwriting: SavedUnderwriting, notes: string | null) => SavedDealSnapshot;
  /** When this is a live deal (not saved-view), allow Save Deal. */
  canCreate?: boolean;
}

const moneyInput = (val: number, onChange: (n: number) => void, id: string) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
    <Input
      id={id}
      type="number"
      min="0"
      className="pl-7 font-mono"
      value={val ? String(val) : ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  </div>
);

const DealUnderwritingPanel = ({ listPrice, initial, savedRecord, buildSnapshot, canCreate = true }: Props) => {
  const { saveDeal, updateSaved, unsaveDeal, canSave } = useSavedDeals();
  const [arv, setArv] = useState<number>(initial.arv);
  const [rent, setRent] = useState<number>(initial.expected_rent);
  const [breakdown, setBreakdown] = useState<LineItems>(initial.repair_breakdown ?? emptyLineItems());
  const [usingBreakdown, setUsingBreakdown] = useState<boolean>(!!initial.repair_breakdown);
  const [totalRepairs, setTotalRepairs] = useState<number>(initial.total_repairs);
  const [notes, setNotes] = useState<string>(savedRecord?.notes ?? "");
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [confirmUnsave, setConfirmUnsave] = useState(false);

  // Re-seed when saved record changes (e.g. after navigating into a different saved deal)
  useEffect(() => {
    setArv(initial.arv);
    setRent(initial.expected_rent);
    setBreakdown(initial.repair_breakdown ?? emptyLineItems());
    setUsingBreakdown(!!initial.repair_breakdown);
    setTotalRepairs(initial.total_repairs);
    setNotes(savedRecord?.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRecord?.id]);

  // If breakdown is in use, total is the sum.
  useEffect(() => {
    if (usingBreakdown) setTotalRepairs(sumLineItems(breakdown));
  }, [usingBreakdown, breakdown]);

  const metrics = useMemo(
    () => recomputeMetrics(listPrice, arv, rent, totalRepairs),
    [listPrice, arv, rent, totalRepairs],
  );

  const current: SavedUnderwriting = {
    arv,
    expected_rent: rent,
    total_repairs: totalRepairs,
    repair_breakdown: usingBreakdown ? breakdown : null,
    ...metrics,
  };

  const savedUnderwriting = savedRecord?.underwriting ?? null;
  const notesChanged = (savedRecord?.notes ?? "") !== notes;
  const diff = savedUnderwriting ? diffUnderwriting(current, savedUnderwriting) : { changed: true, fields: [] };
  const dirty = !!savedRecord && (diff.changed || notesChanged);

  const updateLine = (k: keyof LineItems, v: number) => {
    setBreakdown((b) => ({ ...b, [k]: v }));
    setUsingBreakdown(true);
  };

  const handleSave = async () => {
    if (!canSave) {
      toast({ title: "Sign in to save deals", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const snapshot = buildSnapshot(current, notes || null);
      await saveDeal(snapshot);
      toast({ title: "Saved to My Saved Deals" });
    } catch (e: unknown) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async () => {
    if (!savedRecord) return;
    setBusy(true);
    try {
      const snapshot = buildSnapshot(current, notes || null);
      await updateSaved(savedRecord.id, snapshot);
      toast({ title: "Saved deal updated" });
    } catch (e: unknown) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
      setConfirmUpdate(false);
    }
  };

  const handleUnsave = async () => {
    if (!savedRecord) return;
    setBusy(true);
    try {
      await unsaveDeal(savedRecord.id);
      toast({ title: "Removed from My Saved Deals" });
    } catch (e: unknown) {
      toast({ title: "Unsave failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setBusy(false);
      setConfirmUnsave(false);
    }
  };

  const handleReset = () => {
    setArv(initial.arv);
    setRent(initial.expected_rent);
    setBreakdown(initial.repair_breakdown ?? emptyLineItems());
    setUsingBreakdown(!!initial.repair_breakdown);
    setTotalRepairs(initial.total_repairs);
    setNotes(savedRecord?.notes ?? "");
  };

  const lineKeys = Object.keys(REPAIR_LINE_LABELS) as Array<keyof LineItems>;

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Underwriting</h2>
        {savedRecord && (
          <Badge variant="secondary" className="text-xs">
            <Heart className="w-3 h-3 fill-current mr-1" /> Saved
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        All figures are estimates. Edit any field — totals and deal metrics recalculate live. Use Save Deal to persist a private snapshot.
      </p>

      {/* Editable inputs */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="uw-arv">Est. ARV</Label>
          {moneyInput(arv, setArv, "uw-arv")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="uw-rent">Expected Rent (/mo)</Label>
          {moneyInput(rent, setRent, "uw-rent")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="uw-repairs">Total Repairs</Label>
          {moneyInput(
            totalRepairs,
            (n) => {
              setTotalRepairs(n);
              setUsingBreakdown(false);
            },
            "uw-repairs",
          )}
          {usingBreakdown && (
            <p className="text-[10px] text-muted-foreground">Sum of repair breakdown below</p>
          )}
        </div>
      </div>

      {/* Collapsible breakdown */}
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setBreakdownOpen((o) => !o)}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground"
        >
          <span>View / Edit Repair Breakdown</span>
          {breakdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {breakdownOpen && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {lineKeys.map((k) => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">{REPAIR_LINE_LABELS[k]}</Label>
                {moneyInput(Number(breakdown[k] ?? 0), (n) => updateLine(k, n), `uw-li-${k}`)}
              </div>
            ))}
            <div className="sm:col-span-2 flex items-center justify-between border-t border-border pt-2 mt-1">
              <span className="text-sm text-muted-foreground">Breakdown total</span>
              <span className="font-mono text-sm font-semibold text-primary">{formatCurrency(sumLineItems(breakdown))}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-border pt-4">
        <Metric label="MAO (75% of ARV − Repairs)" value={formatCurrency(metrics.mao)} highlight={listPrice <= metrics.mao && arv > 0} />
        <Metric label="Rent / All-In" value={formatPercent(metrics.rent_to_price_pct)} highlight={metrics.rent_to_price_pct >= 0.0135} />
        <Metric label="All-In % of ARV" value={formatPercent(metrics.all_in_pct_of_arv)} highlight={metrics.all_in_pct_of_arv > 0 && metrics.all_in_pct_of_arv <= 0.75} />
        <Metric label="All-In" value={formatCurrency(listPrice + totalRepairs)} />
      </div>

      {/* Notes */}
      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="uw-notes">Investor Notes</Label>
        <Textarea
          id="uw-notes"
          rows={3}
          placeholder="Private notes about this deal…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Save bar */}
      <div className="border-t border-border pt-4 flex flex-wrap items-center gap-2">
        {!savedRecord && canCreate && (
          <Button onClick={handleSave} disabled={busy || !canSave}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
            Save Deal
          </Button>
        )}
        {savedRecord && (
          <>
            {dirty ? (
              <>
                <Button onClick={() => setConfirmUpdate(true)} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Saved Deal
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={busy}>
                  <RefreshCw className="w-4 h-4" />
                  Discard changes
                </Button>
                <span className="text-xs text-amber-600 ml-1">Unsaved underwriting changes</span>
              </>
            ) : (
              <Badge variant="outline" className="text-xs">
                Saved ✓ no changes
              </Badge>
            )}
            <div className="ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setConfirmUnsave(true)} disabled={busy} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
                Unsave
              </Button>
            </div>
          </>
        )}
        {!savedRecord && !canSave && (
          <span className="text-xs text-muted-foreground">Sign in to persist this underwriting as a saved deal.</span>
        )}
      </div>

      <AlertDialog open={confirmUpdate} onOpenChange={setConfirmUpdate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update saved deal?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved underwriting changes. Overwrite the previously saved snapshot with the current values?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdate}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmUnsave} onOpenChange={setConfirmUnsave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from saved deals?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your saved underwriting and notes for this property.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnsave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unsave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Metric = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={cn("rounded-lg border p-3", highlight ? "bg-green-50 border-green-200" : "bg-accent/30 border-border")}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn("font-serif text-lg font-medium mt-1", highlight ? "text-green-700" : "text-foreground")}>{value}</p>
  </div>
);

export default DealUnderwritingPanel;
