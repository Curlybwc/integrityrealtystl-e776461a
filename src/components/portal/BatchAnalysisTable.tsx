import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ExternalLink, Camera, LayoutGrid, List } from "lucide-react";
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
import { MlsListing } from "@/hooks/useMlsSearch";
import {
  computeDealMetrics,
  estimateSystemRent,
  estimateSystemArv,
  estimateRehabTier,
  formatCurrency,
  formatPercent,
  type Strategy,
  type ScreeningConfig,
  DEFAULT_SCREENING_CONFIG,
} from "@/lib/screening";
import { cn } from "@/lib/utils";
import ListingCard from "./ListingCard";
import ListingPhotoModal from "./ListingPhotoModal";

interface AnalyzedListing extends MlsListing {
  rent_effective: number;
  arv_effective: number;
  rent_to_price_pct: number;
  all_in_pct_of_arv: number;
  strategy: Strategy;
  passes_turnkey: boolean;
  passes_brrrr: boolean;
  passes_flip: boolean;
}

type SortField = "list_price" | "rent_to_price_pct" | "all_in_pct_of_arv" | "strategy";
type ViewMode = "table" | "grid";
type StrategyFilter = "all" | "pass_any" | "Turnkey" | "BRRRR" | "Flip" | "None";

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

const BatchAnalysisTable = ({ listings, screeningConfig }: BatchAnalysisTableProps) => {
  const [sortField, setSortField] = useState<SortField>("strategy");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>("all");
  const [photoModal, setPhotoModal] = useState<{ photos: string[]; address: string } | null>(null);

  const config = screeningConfig ?? DEFAULT_SCREENING_CONFIG;

  const analyzed: AnalyzedListing[] = useMemo(() => {
    return listings.map((l) => {
      const rent_system = estimateSystemRent(l.zip, l.beds);
      const arv_system = estimateSystemArv(l.zip, l.sqft);
      const rehab_tier_system = estimateRehabTier(l.list_price, arv_system);

      const metrics = computeDealMetrics({
        source_type: "MLS",
        list_price: l.list_price,
        sqft: l.sqft,
        zip: l.zip,
        beds: l.beds,
        mls_status: l.mls_status as any,
        rent_system,
        arv_system,
        rehab_tier_system,
      }, config);

      return { ...l, ...metrics };
    });
  }, [listings, config]);

  const stats = useMemo(() => {
    const passAny = analyzed.filter((l) => l.passes_turnkey || l.passes_brrrr || l.passes_flip).length;
    const turnkey = analyzed.filter((l) => l.passes_turnkey).length;
    const brrrr = analyzed.filter((l) => l.passes_brrrr).length;
    const flip = analyzed.filter((l) => l.passes_flip).length;
    const none = analyzed.filter((l) => !l.passes_turnkey && !l.passes_brrrr && !l.passes_flip).length;
    return { total: analyzed.length, passAny, turnkey, brrrr, flip, none };
  }, [analyzed]);

  const filtered = useMemo(() => {
    if (strategyFilter === "all") return analyzed;
    if (strategyFilter === "pass_any") return analyzed.filter((l) => l.passes_turnkey || l.passes_brrrr || l.passes_flip);
    if (strategyFilter === "Turnkey") return analyzed.filter((l) => l.passes_turnkey);
    if (strategyFilter === "BRRRR") return analyzed.filter((l) => l.passes_brrrr);
    if (strategyFilter === "Flip") return analyzed.filter((l) => l.passes_flip);
    if (strategyFilter === "None") return analyzed.filter((l) => !l.passes_turnkey && !l.passes_brrrr && !l.passes_flip);
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

  const passingCount = stats.passAny;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "strategy");
    }
  };

  const openPhotos = (l: AnalyzedListing) => {
    if (l.photo_urls?.length) {
      setPhotoModal({ photos: l.photo_urls, address: l.address });
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
              onPhotoClick={() => openPhotos(l)}
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
                <TableHead><SortButton field="strategy">Strategy</SortButton></TableHead>
                <TableHead>Est. Rent</TableHead>
                <TableHead>ARV</TableHead>
                <TableHead><SortButton field="rent_to_price_pct">RTP Ratio</SortButton></TableHead>
                <TableHead><SortButton field="all_in_pct_of_arv">All-In%</SortButton></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((l) => {
                const passes = l.passes_turnkey || l.passes_brrrr || l.passes_flip;
                const photoCount = l.photo_urls?.length ?? 0;
                return (
                  <TableRow
                    key={l.mls_listing_id}
                    className={cn(!passes && "opacity-50")}
                  >
                    <TableCell className="pr-0">
                      {photoCount > 0 ? (
                        <button
                          onClick={() => openPhotos(l)}
                          className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                          title={`${photoCount} photos`}
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span className="text-[10px]">{photoCount}</span>
                        </button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium text-xs">{l.address}</TableCell>
                    <TableCell className="text-xs">{l.city}</TableCell>
                    <TableCell className="text-xs">{l.zip}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.list_price)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {l.beds}/{l.baths}/{l.sqft ? `${l.sqft.toLocaleString()}${(l as any).sqft_source === 'public_record' ? ' (PR)' : ''}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {l.passes_flip && <Badge variant="outline" className="text-xs">Flip</Badge>}
                        {l.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
                        {l.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
                        {!l.passes_flip && !l.passes_brrrr && !l.passes_turnkey && <Badge variant="destructive" className="text-xs">None</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.rent_effective)}</TableCell>
                    <TableCell className="text-xs">{formatCurrency(l.arv_effective)}</TableCell>
                    <TableCell className={cn(
                      "text-xs font-medium",
                      l.rent_to_price_pct >= 0.013 ? "text-green-600" : l.rent_to_price_pct >= 0.01 ? "text-orange-500" : "text-destructive"
                    )}>
                      {formatPercent(l.rent_to_price_pct)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-xs font-medium",
                      l.all_in_pct_of_arv <= 0.75 ? "text-green-600" : l.all_in_pct_of_arv <= 0.80 ? "text-orange-500" : "text-destructive"
                    )}>
                      {formatPercent(l.all_in_pct_of_arv)}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/portal/analyzer?address=${encodeURIComponent(l.address)}&zip=${l.zip}&beds=${l.beds}&baths=${l.baths}&sqft=${l.sqft}&price=${l.list_price}`}
                      >
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Analyze
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    No listings to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Photo Modal */}
      <ListingPhotoModal
        open={!!photoModal}
        onOpenChange={(open) => !open && setPhotoModal(null)}
        photos={photoModal?.photos ?? []}
        address={photoModal?.address ?? ""}
      />
    </div>
  );
};

export default BatchAnalysisTable;
