import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ExternalLink, TrendingUp, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatPercent,
  estimateSystemRent,
  estimateSystemArv,
  estimateRehabTier,
  computeDealMetrics,
} from "@/lib/screening";
import ListingDetailBase, { type RawListing } from "@/components/listing/ListingDetailBase";

const InvestorListingPage = () => {
  const navigate = useNavigate();
  const { mlsNumber } = useParams<{ mlsNumber: string }>();

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/portal/investor/search-analyzer");
    }
  };

  const { data: listing, isLoading, error } = useQuery<RawListing | null>({
    queryKey: ["mls-listing", mlsNumber],
    queryFn: async () => {
      const { data, error: fnError } = await supabase.functions.invoke(
        "fetch-mls-listings",
        { body: { mlsNumber } }
      );
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      return data?.listings?.[0] ?? null;
    },
    enabled: !!mlsNumber,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Button variant="ghost" size="sm" className="gap-1" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {error ? `Error: ${(error as Error).message}` : "Listing not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Compute investor metrics
  const rent_system = estimateSystemRent(listing.zip, listing.beds);
  const arv_system = estimateSystemArv(listing.zip, listing.sqft);
  const rehab_tier_system = estimateRehabTier(listing.list_price, arv_system);
  const metrics = computeDealMetrics({
    source_type: "MLS" as const,
    list_price: listing.list_price,
    sqft: listing.sqft,
    zip: listing.zip,
    beds: listing.beds,
    mls_status: listing.mls_status as any,
    rent_system,
    arv_system,
    rehab_tier_system,
  });

  const analyzeUrl = `/portal/investor/analyzer?${new URLSearchParams({
    address: listing.address ?? "",
    zip: listing.zip ?? "",
    beds: String(listing.beds ?? ""),
    baths: String(listing.baths ?? ""),
    sqft: String(listing.sqft ?? ""),
    price: String(listing.list_price ?? ""),
  }).toString()}`;

  return (
    <ListingDetailBase listing={listing} onBack={goBack}>
      {/* Collapsible Investor Analysis */}
      <Collapsible defaultOpen={false}>
        <Card className="border-primary/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Investor Analysis
                </span>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Strategy badges */}
              <div className="flex flex-wrap gap-2">
                {metrics.passes_flip && <Badge variant="outline">Flip</Badge>}
                {metrics.passes_brrrr && <Badge variant="secondary">BRRRR</Badge>}
                {metrics.passes_turnkey && <Badge variant="default">Turnkey</Badge>}
                {!metrics.passes_flip && !metrics.passes_brrrr && !metrics.passes_turnkey && (
                  <Badge variant="destructive">Does Not Pass</Badge>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Est. Rent</p>
                  <p className="font-semibold">{formatCurrency(metrics.rent_effective)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">ARV</p>
                  <p className="font-semibold">{formatCurrency(metrics.arv_effective)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">RTP Ratio</p>
                  <p className={cn("font-semibold",
                    metrics.rent_to_price_pct >= 0.013 ? "text-green-600" :
                    metrics.rent_to_price_pct >= 0.01 ? "text-orange-500" : "text-destructive"
                  )}>
                    {formatPercent(metrics.rent_to_price_pct)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">All-In %</p>
                  <p className={cn("font-semibold",
                    metrics.all_in_pct_of_arv <= 0.75 ? "text-green-600" :
                    metrics.all_in_pct_of_arv <= 0.80 ? "text-orange-500" : "text-destructive"
                  )}>
                    {formatPercent(metrics.all_in_pct_of_arv)}
                  </p>
                </div>
              </div>

              <Button asChild>
                <a href={analyzeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Analyzer
                </a>
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </ListingDetailBase>
  );
};

export default InvestorListingPage;
