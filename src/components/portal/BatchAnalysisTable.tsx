import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, ExternalLink } from "lucide-react";
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
import { MlsListing } from "@/hooks/useMlsSearch";
import {
  computeDealMetrics,
  estimateSystemRent,
  estimateSystemArv,
  estimateRehabTier,
  formatCurrency,
  formatPercent,
  type Strategy,
} from "@/lib/screening";
import { cn } from "@/lib/utils";

interface AnalyzedListing extends MlsListing {
  rent_effective: number;
  arv_effective: number;
  rent_to_price_pct: number;
  all_in_pct_of_arv: number;
  strategy: Strategy;
  passes_turnkey: boolean;
  passes_brrrr: boolean;
}

type SortField = "list_price" | "rent_to_price_pct" | "all_in_pct_of_arv" | "strategy";

interface BatchAnalysisTableProps {
  listings: MlsListing[];
}

const strategyOrder: Record<Strategy, number> = {
  Both: 0,
  BRRRR: 1,
  Turnkey: 2,
  None: 3,
};

const strategyVariant = (s: Strategy) => {
  if (s === "Both") return "default";
  if (s === "Turnkey" || s === "BRRRR") return "secondary";
  return "outline";
};

const BatchAnalysisTable = ({ listings }: BatchAnalysisTableProps) => {
  const [sortField, setSortField] = useState<SortField>("strategy");
  const [sortAsc, setSortAsc] = useState(true);

  const analyzed: AnalyzedListing[] = useMemo(() => {
    return listings.map((l) => {
      const rent_system = estimateSystemRent(l.zip, l.beds);
      const arv_system = estimateSystemArv(l.zip, l.sqft);
      const rehab_tier_system = estimateRehabTier(l.year_built);

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
      });

      return { ...l, ...metrics };
    });
  }, [listings]);

  const sorted = useMemo(() => {
    return [...analyzed].sort((a, b) => {
      let cmp = 0;
      if (sortField === "strategy") {
        cmp = strategyOrder[a.strategy] - strategyOrder[b.strategy];
      } else {
        cmp = (a[sortField] ?? 0) - (b[sortField] ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [analyzed, sortField, sortAsc]);

  const passingCount = analyzed.filter((l) => l.strategy !== "None").length;

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

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{passingCount}</span> of{" "}
        <span className="font-semibold text-foreground">{analyzed.length}</span> listings pass screening
      </p>

      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>ZIP</TableHead>
              <TableHead><SortButton field="list_price">Price</SortButton></TableHead>
              <TableHead>Bd/Ba/Sf</TableHead>
              <TableHead><SortButton field="strategy">Strategy</SortButton></TableHead>
              <TableHead>Est. Rent</TableHead>
              <TableHead>ARV</TableHead>
              <TableHead><SortButton field="rent_to_price_pct">RTP%</SortButton></TableHead>
              <TableHead><SortButton field="all_in_pct_of_arv">All-In%</SortButton></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((l) => {
              const passes = l.strategy !== "None";
              return (
                <TableRow
                  key={l.mls_listing_id}
                  className={cn(!passes && "opacity-50")}
                >
                  <TableCell className="font-medium text-xs">{l.address}</TableCell>
                  <TableCell className="text-xs">{l.city}</TableCell>
                  <TableCell className="text-xs">{l.zip}</TableCell>
                  <TableCell className="text-xs">{formatCurrency(l.list_price)}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {l.beds}/{l.baths}/{l.sqft?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={strategyVariant(l.strategy)} className="text-xs">
                      {l.strategy}
                    </Badge>
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
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  No listings to display
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BatchAnalysisTable;
