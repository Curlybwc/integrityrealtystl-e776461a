import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCurrency,
  formatPercent,
  estimateSystemRent,
  estimateSystemArv,
  estimateRehabTier,
  computeDealMetrics,
} from "@/lib/screening";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Bed,
  Bath,
  Ruler,
  Clock,
  Phone,
  Mail,
  Building2,
  User,
  TrendingUp,
} from "lucide-react";
import Layout from "@/components/Layout";

interface RawListing {
  mls_listing_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  year_built?: number;
  property_type: string;
  list_price: number;
  mls_status: string;
  photo_urls: string[];
  sqft_source?: string;
  raw?: any;
}

const ListingDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mlsNumber } = useParams<{ mlsNumber: string }>();
  const [photoIndex, setPhotoIndex] = useState(0);

  // Detect if user came from portal (investor context)
  const isInvestor = location.state?.fromPortal === true ||
    document.referrer.includes("/portal");

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
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
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  const raw = listing.raw ?? {};
  const details = raw.details ?? {};
  const agentRaw = raw.agents ?? {};
  const agent = Array.isArray(agentRaw) ? agentRaw[0] : agentRaw;
  const office = raw.office ?? agent?.office ?? {};
  const photos = listing.photo_urls ?? [];
  const hasPhotos = photos.length > 0;

  // Days on market
  const listDate = raw.listDate ?? raw.originalListDate;
  let daysOnMarket: number | null = null;
  if (listDate) {
    const diff = Date.now() - new Date(listDate).getTime();
    daysOnMarket = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  const description = details.description ?? details.extras ?? raw.remarks ?? "";

  const statusColor: Record<string, string> = {
    Active: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Sold: "bg-red-100 text-red-800",
  };

  const prevPhoto = () => setPhotoIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
  const nextPhoto = () => setPhotoIndex((i) => (i < photos.length - 1 ? i + 1 : 0));

  // Investor metrics (computed on-demand, no extra API call)
  const investorMetrics = isInvestor ? (() => {
    const rent_system = estimateSystemRent(listing.zip, listing.beds);
    const arv_system = estimateSystemArv(listing.zip, listing.sqft);
    const rehab_tier_system = estimateRehabTier(listing.list_price, arv_system);
    return {
      ...computeDealMetrics({
        source_type: "MLS" as const,
        list_price: listing.list_price,
        sqft: listing.sqft,
        zip: listing.zip,
        beds: listing.beds,
        mls_status: listing.mls_status as any,
        rent_system,
        arv_system,
        rehab_tier_system,
      }),
    };
  })() : null;

  const analyzeUrl = `/portal/analyzer?${new URLSearchParams({
    address: listing.address ?? "",
    zip: listing.zip ?? "",
    beds: String(listing.beds ?? ""),
    baths: String(listing.baths ?? ""),
    sqft: String(listing.sqft ?? ""),
    price: String(listing.list_price ?? ""),
  }).toString()}`;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back nav */}
        <Button variant="ghost" size="sm" className="gap-1" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" /> ← Back to Results
        </Button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">
              {formatCurrency(listing.list_price)}
            </h1>
            <p className="text-lg text-foreground font-medium">{listing.address}</p>
            <p className="text-muted-foreground">
              {listing.city}, {listing.state} {listing.zip}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.beds} Beds</span>
              <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {listing.baths} Baths</span>
              <span className="flex items-center gap-1"><Ruler className="h-4 w-4" /> {listing.sqft?.toLocaleString() ?? "N/A"} sqft</span>
              {daysOnMarket !== null && (
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {daysOnMarket} DOM</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <Badge className={statusColor[listing.mls_status] ?? "bg-muted text-foreground"}>
              {listing.mls_status}
            </Badge>
            <Badge variant="outline" className="text-xs">MLS# {listing.mls_listing_id}</Badge>
          </div>
        </div>

        {/* Photo Carousel */}
        <Card className="overflow-hidden">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              {hasPhotos ? (
                <img
                  src={photos[photoIndex]}
                  alt={`${listing.address} photo ${photoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">No photos available</span>
                </div>
              )}
            </AspectRatio>
            {hasPhotos && photos.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-80 hover:opacity-100"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full opacity-80 hover:opacity-100"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            {hasPhotos && (
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                {photoIndex + 1} / {photos.length}
              </span>
            )}
          </div>
          {hasPhotos && photos.length > 1 && (
            <div className="flex gap-1 p-2 overflow-x-auto">
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                    i === photoIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Investor-only section */}
        {isInvestor && investorMetrics && (
          <Card className="border-primary/30 bg-accent/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strategy badges */}
              <div className="flex flex-wrap gap-2">
                {investorMetrics.passes_flip && <Badge variant="outline">Flip</Badge>}
                {investorMetrics.passes_brrrr && <Badge variant="secondary">BRRRR</Badge>}
                {investorMetrics.passes_turnkey && <Badge variant="default">Turnkey</Badge>}
                {!investorMetrics.passes_flip && !investorMetrics.passes_brrrr && !investorMetrics.passes_turnkey && (
                  <Badge variant="destructive">Does Not Pass</Badge>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Est. Rent</p>
                  <p className="font-semibold">{formatCurrency(investorMetrics.rent_effective)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">ARV</p>
                  <p className="font-semibold">{formatCurrency(investorMetrics.arv_effective)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">RTP Ratio</p>
                  <p className={cn("font-semibold",
                    investorMetrics.rent_to_price_pct >= 0.013 ? "text-green-600" :
                    investorMetrics.rent_to_price_pct >= 0.01 ? "text-orange-500" : "text-destructive"
                  )}>
                    {formatPercent(investorMetrics.rent_to_price_pct)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">All-In %</p>
                  <p className={cn("font-semibold",
                    investorMetrics.all_in_pct_of_arv <= 0.75 ? "text-green-600" :
                    investorMetrics.all_in_pct_of_arv <= 0.80 ? "text-orange-500" : "text-destructive"
                  )}>
                    {formatPercent(investorMetrics.all_in_pct_of_arv)}
                  </p>
                </div>
              </div>

              <Button asChild>
                <a href={analyzeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Analyze This Deal
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Description + Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                  <DetailRow label="Property Type" value={listing.property_type} />
                  <DetailRow label="Year Built" value={listing.year_built} />
                  <DetailRow label="Lot Size" value={details.lotSize ?? details.lotSizeCode ?? raw.lot?.lotSize} />
                  <DetailRow label="Taxes" value={raw.taxes?.annualAmount ? formatCurrency(Number(raw.taxes.annualAmount)) : details.taxes} />
                  <DetailRow label="Garage" value={details.numGarageSpaces ?? details.garage} />
                  <DetailRow label="Heating" value={details.heating ?? details.heatType} />
                  <DetailRow label="Cooling" value={details.cooling ?? details.airConditioning} />
                  <DetailRow label="Sewer" value={details.sewer ?? details.sewers} />
                  <DetailRow label="Water" value={details.water ?? details.waterSource} />
                  <DetailRow label="Basement" value={details.basement ?? details.basementType} />
                  <DetailRow label="Stories" value={details.numStories ?? details.stories} />
                  <DetailRow label="Sqft Source" value={listing.sqft_source === "public_record" ? "Public Record" : "MLS"} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Agent Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" /> Listing Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {agent?.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.name}</span>
                  </div>
                )}
                {(office?.name || agent?.office?.name) && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{office.name || agent.office.name}</span>
                  </div>
                )}
                {agent?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${agent.phone}`} className="text-primary hover:underline">{agent.phone}</a>
                  </div>
                )}
                {agent?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${agent.email}`} className="text-primary hover:underline text-xs break-all">{agent.email}</a>
                  </div>
                )}
                {!agent?.name && !office?.name && (
                  <p className="text-muted-foreground">Agent info not available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Facts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Facts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {listDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">List Date</span>
                    <span>{new Date(listDate).toLocaleDateString()}</span>
                  </div>
                )}
                {raw.soldPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sold Price</span>
                    <span>{formatCurrency(Number(raw.soldPrice))}</span>
                  </div>
                )}
                {raw.soldDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sold Date</span>
                    <span>{new Date(raw.soldDate).toLocaleDateString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MLS #</span>
                  <span className="font-mono text-xs">{listing.mls_listing_id}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "" || value === 0) return null;
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default ListingDetail;
