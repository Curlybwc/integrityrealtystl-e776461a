import { useState, useMemo, useEffect, useRef } from "react";

import { ArrowUpDown, ExternalLink, Camera, LayoutGrid, List, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MlsListing } from "@/hooks/useMlsSearch";
import {
  computeDealMetrics,
  estimateSystemRent,
  estimateSystemArv,
  formatCurrency,
  formatPercent,
  type Strategy,
  type ScreeningConfig,
  DEFAULT_SCREENING_CONFIG,
} from "@/lib/screening";
import {
  fetchActiveAnalysesBulk,
  requestRepairAnalysis,
  repairStateFromRow,
  type RepairAnalysisRow,
  type RepairState,
} from "@/lib/repairAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import ListingCard from "./ListingCard";

interface AnalyzedListing extends MlsListing {
  rent_effective: number;
  arv_effective: number;
  rent_to_price_pct: number;
  all_in_pct_of_arv: number;
  strategy: Strategy;
  passes_turnkey: boolean;
  passes_brrrr: boolean;
  passes_flip: boolean;
  rehab_est_effective: number;
  analysis_pending: boolean;
  repair_state: RepairState;
  repair_total: number | null;
  repair_failure_reason: string | null;
}

type SortField = "list_price" | "rent_to_price_pct" | "all_in_pct_of_arv" | "strategy";
type ViewMode = "table" | "grid";
type StrategyFilter = "all" | "pass_any" | "Turnkey" | "BRRRR" | "Flip" | "None" | "Pending";

interface BatchAnalysisTableProps {
  listings: MlsListing[];
  screeningConfig?: ScreeningConfig;
}

const strategyOrder: Record<Strategy, number> = {
  Both: 0,
  BRRRR: 1,
  Turnkey: 2,
  None: 3,
};

const ENQUEUE_CONCURRENCY = 3;

const BatchAnalysisTable = ({ listings, screeningConfig }: BatchAnalysisTableProps) => {
  const [sortField, setSortField] = useState<SortField>("strategy");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>("all");
  const [analyses, setAnalyses] = useState<Record<string, RepairAnalysisRow>>({});
  const enqueuedRef = useRef<Set<string>>(new Set());

  const config = screeningConfig ?? DEFAULT_SCREENING_CONFIG;

  const mlsIds = useMemo(
    () => listings.map((l) => l.mls_listing_id).filter(Boolean) as string[],
    [listings]
  );

  // Hydrate cache for the current listing set
  useEffect(() => {
    if (mlsIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const map = await fetchActiveAnalysesBulk(mlsIds);
      if (!cancelled) setAnalyses((prev) => ({ ...prev, ...map }));
    })();
    return () => { cancelled = true; };
  }, [mlsIds]);

  // Realtime: listen for updates to any visible mlsId
  useEffect(() => {
    if (mlsIds.length === 0) return;
    const idSet = new Set(mlsIds);
    const channel = supabase
      .channel(`batch-repair-${mlsIds.length}-${mlsIds[0] ?? ""}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repair_analyses" },
        (payload) => {
          const row = payload.new as RepairAnalysisRow | undefined;
          if (!row || !row.is_active) return;
          if (!idSet.has(row.mls_listing_id)) return;
          setAnalyses((prev) => ({ ...prev, [row.mls_listing_id]: row }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [mlsIds]);

  // Auto-enqueue missing analyses with bounded concurrency
  useEffect(() => {
    if (mlsIds.length === 0) return;
    const missing = mlsIds.filter((id) => !analyses[id] && !enqueuedRef.current.has(id));
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      let i = 0;
      const workers = Array.from({ length: ENQUEUE_CONCURRENCY }, async () => {
        while (!cancelled && i < missing.length) {
          const id = missing[i++];
          enqueuedRef.current.add(id);
          try {
            const row = await requestRepairAnalysis(id, "user");
            if (!cancelled && row) {
              setAnalyses((prev) => ({ ...prev, [id]: row }));
              // If quota blocked, stop further enqueues this pass
              if (row.analysis_status === "quota_blocked") {
                i = missing.length;
              }
            }
          } catch (e) {
            console.error("auto-enqueue failed", id, e);
          }
        }
      });
      await Promise.all(workers);
    })();
    return () => { cancelled = true; };
  }, [mlsIds, analyses]);

  const analyzed: AnalyzedListing[] = useMemo(() => {
    return listings.map((l) => {
      const rent_system = estimateSystemRent(l.zip, l.beds);
      const arv_system = estimateSystemArv(l.zip, l.sqft);
      const row = l.mls_listing_id ? analyses[l.mls_listing_id] : undefined;
      const repair_state = repairStateFromRow(row);
      const repair_total = row?.total_repair_estimate ?? null;

      const metrics = computeDealMetrics({
        source_type: "MLS",
        list_price: l.list_price,
        sqft: l.sqft,
        zip: l.zip,
        beds: l.beds,
        mls_status: l.mls_status as any,
        rent_system,
        arv_system,
        rehab_est_from_analysis: repair_total,
        repair_analysis_status: repair_state,
      }, config);

      return {
        ...l,
        ...metrics,
        repair_state,
        repair_total,
        repair_failure_reason: row?.failure_reason ?? null,
      };
    });
  }, [listings, analyses, config]);

  const stats = useMemo(() => {
    const pending = analyzed.filter((l) => l.analysis_pending).length;
    const passAny = analyzed.filter((l) => !l.analysis_pending && (l.passes_turnkey || l.passes_brrrr || l.passes_flip)).length;
    const turnkey = analyzed.filter((l) => l.passes_turnkey).length;
    const brrrr = analyzed.filter((l) => l.passes_brrrr).length;
    const flip = analyzed.filter((l) => l.passes_flip).length;
    const none = analyzed.filter((l) => !l.analysis_pending && !l.passes_turnkey && !l.passes_brrrr && !l.passes_flip).length;
    return { total: analyzed.length, passAny, turnkey, brrrr, flip, none, pending };
  }, [analyzed]);

  const filtered = useMemo(() => {
    if (strategyFilter === "all") return analyzed;
    if (strategyFilter === "Pending") return analyzed.filter((l) => l.analysis_pending);
    if (strategyFilter === "pass_any") return analyzed.filter((l) => !l.analysis_pending && (l.passes_turnkey || l.passes_brrrr || l.passes_flip));
    if (strategyFilter === "Turnkey") return analyzed.filter((l) => l.passes_turnkey);
    if (strategyFilter === "BRRRR") return analyzed.filter((l) => l.passes_brrrr);
    if (strategyFilter === "Flip") return analyzed.filter((l) => l.passes_flip);
    if (strategyFilter === "None") return analyzed.filter((l) => !l.analysis_pending && !l.passes_turnkey && !l.passes_brrrr && !l.passes_flip);
    return analyzed;
  }, [analyzed, strategyFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "strategy") {
        cmp = strategyOrder[a.strategy] - strategyOrder[b.strategy];
      } else {
        cmp = (a[sortField] ?? 0) - (b[sortField] ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortField, sortAsc]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "strategy");
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => toggleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  const renderRepairCell = (l: AnalyzedListing) => {
    switch (l.repair_state) {
      case "complete":
        return <span className="text-xs font-medium">{formatCurrency(l.repair_total ?? 0)}</span>;
      case "pending":
      case "analyzing":
        return (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing
          </Badge>
        );
      case "quota_blocked":
        return <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">Quota reached</Badge>;
      case "failed":
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[10px] border-destructive text-destructive gap-1">
                <AlertTriangle className="h-3 w-3" />
                Failed
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs"><p className="text-xs">{l.repair_failure_reason ?? "Analysis failed"}</p></TooltipContent>
          </Tooltip>
        );
      default:
        return <span className="text-xs text-muted-foreground">—</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", `All (${stats.total})`],
          ["pass_any", `Pass Any (${stats.passAny})`],
          ["Flip", `Flip (${stats.flip})`],
          ["BRRRR", `BRRRR (${stats.brrrr})`],
          ["Turnkey", `Turnkey (${stats.turnkey})`],
          ["None", `None (${stats.none})`],
          ["Pending", `Pending (${stats.pending})`],
        ] as [StrategyFilter, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={strategyFilter === key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStrategyFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Header row with count and view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{sorted.length}</span> listings
        </p>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as ViewMode)}
          size="sm"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((l) => (
            <ListingCard
              key={l.mls_listing_id}
              listing={l}
              analysisPending={l.analysis_pending}
              repairState={l.repair_state}
              repairTotal={l.repair_total}
            />
          ))}
          {sorted.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              No listings to display
            </p>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead><SortButton field="list_price">Price</SortButton></TableHead>
                <TableHead>Bd/Ba/Sf</TableHead>
                <TableHead>Repairs</TableHead>
                <TableHead><SortButton field="strategy">Strategy</SortButton></TableHead>
                <TableHead>Est. Rent</TableHead>
                <TableHead>ARV</TableHead>
                <TableHead><SortButton field="rent_to_price_pct">RTP</SortButton></TableHead>
                <TableHead><SortButton field="all_in_pct_of_arv">All-In%</SortButton></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((l) => {
                const passes = !l.analysis_pending && (l.passes_turnkey || l.passes_brrrr || l.passes_flip);
                const photoCount = l.photo_urls?.length ?? 0;
                return (
                  <TableRow
                    key={l.mls_listing_id}
                    className={cn(!passes && !l.analysis_pending && "opacity-50")}
                  >
                    <TableCell className="pr-0">
                      {photoCount > 0 ? (
                        <a
                          href={`/portal/investor/listing/${l.mls_listing_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="View listing"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span className="text-[10px]">{photoCount}</span>
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{l.address}</TableCell>
                    <TableCell className="text-xs">{l.city}</TableCell>
                    <TableCell className="text-xs">{l.zip}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.list_price)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {l.beds}/{l.baths}/{l.sqft ? `${l.sqft.toLocaleString()}${(l as any).sqft_source === 'public_record' ? ' (PR)' : ''}` : 'N/A'}
                    </TableCell>
                    <TableCell>{renderRepairCell(l)}</TableCell>
                    <TableCell>
                      {l.analysis_pending ? (
                        <span className="text-[10px] text-muted-foreground italic">—</span>
                      ) : (
                        <div className="flex gap-1">
                          {l.passes_flip && <Badge variant="outline" className="text-xs">Flip</Badge>}
                          {l.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
                          {l.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
                          {!l.passes_flip && !l.passes_brrrr && !l.passes_turnkey && <Badge variant="destructive" className="text-xs">None</Badge>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.rent_effective)}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.arv_effective)}</TableCell>
                    <TableCell className={cn(
                      "text-xs font-medium",
                      l.analysis_pending && "text-muted-foreground",
                      !l.analysis_pending && (l.rent_to_price_pct >= 0.013 ? "text-green-600" : l.rent_to_price_pct >= 0.01 ? "text-orange-500" : "text-destructive")
                    )}>
                      {l.analysis_pending ? "—" : formatPercent(l.rent_to_price_pct)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs font-medium",
                      l.analysis_pending && "text-muted-foreground",
                      !l.analysis_pending && (l.all_in_pct_of_arv <= 0.75 ? "text-green-600" : l.all_in_pct_of_arv <= 0.80 ? "text-orange-500" : "text-destructive")
                    )}>
                      {l.analysis_pending ? "—" : formatPercent(l.all_in_pct_of_arv)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                        <a
                          href={`/portal/investor/analyzer?${new URLSearchParams({
                            mlsId: l.mls_listing_id ?? "",
                            address: l.address ?? "",
                            zip: l.zip ?? "",
                            beds: String(l.beds ?? ""),
                            baths: String(l.baths ?? ""),
                            sqft: String(l.sqft ?? ""),
                            price: String(l.list_price ?? ""),
                          }).toString()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Analyze
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                    No listings to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

    </div>
  );
};

export default BatchAnalysisTable;
