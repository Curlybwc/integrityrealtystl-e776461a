import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  Home,
  FileSignature,
  Wrench,
  MessageSquare,
  Phone,
  Calculator,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { useDeals } from "@/hooks/useDeals";
import { useSavedDeals } from "@/hooks/useSavedDeals";
import { formatCurrency, getStatusDisplayLabel, type Deal } from "@/lib/screening";
import {
  buildSnapshotFromDeal,
  propertyKeyForDeal,
  recomputeMetrics,
  type SavedDeal,
  type SavedDealSnapshot,
  type SavedUnderwriting,
} from "@/lib/savedDeals";
import { cn } from "@/lib/utils";
import DealUnderwritingPanel from "@/components/portal/DealUnderwritingPanel";
import CheckMlsUpdatesButton from "@/components/portal/CheckMlsUpdatesButton";

const PortalDealDetail = () => {
  const { dealId, savedId } = useParams();
  const { getDealById } = useDeals();
  const { getById: getSavedById, getByKey } = useSavedDeals();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const savedRecord: SavedDeal | null = savedId ? getSavedById(savedId) : null;
  const deal: Deal | null = !savedId && dealId ? getDealById(dealId) ?? null : null;

  // Build view-model fields that work for both modes
  const vm = useMemo(() => {
    if (savedRecord) {
      const u = savedRecord.underwriting;
      const initial: SavedUnderwriting = {
        arv: u.arv ?? 0,
        expected_rent: u.expected_rent ?? 0,
        total_repairs: u.total_repairs ?? 0,
        repair_breakdown: u.repair_breakdown ?? null,
        mao: u.mao ?? 0,
        rent_to_price_pct: u.rent_to_price_pct ?? 0,
        all_in_pct_of_arv: u.all_in_pct_of_arv ?? 0,
      };
      return {
        mode: "saved" as const,
        address: savedRecord.address,
        city: savedRecord.city,
        state: savedRecord.state,
        zip: savedRecord.zip,
        beds: savedRecord.beds ?? undefined,
        baths: savedRecord.baths ?? undefined,
        sqft: savedRecord.sqft ?? undefined,
        year_built: savedRecord.year_built ?? undefined,
        property_type: savedRecord.property_type ?? "Single Family",
        photos: savedRecord.photo_urls ?? [],
        listPrice: savedRecord.list_price_at_save ?? 0,
        mlsListingId: savedRecord.mls_listing_id ?? undefined,
        sourceTags: savedRecord.source_tags,
        statusLabel: "Saved",
        initial,
        liveDeal: null as Deal | null,
      };
    }
    if (!deal || !deal.buyer_visible) return null;
    const arv = deal.arv_effective || 0;
    const rent = deal.rent_effective || 0;
    const repairs = deal.rehab_est_effective || 0;
    const metrics = recomputeMetrics(deal.list_price || 0, arv, rent, repairs);
    const initial: SavedUnderwriting = {
      arv,
      expected_rent: rent,
      total_repairs: repairs,
      repair_breakdown: null,
      ...metrics,
    };
    return {
      mode: "live" as const,
      address: deal.address,
      city: deal.city,
      state: deal.state,
      zip: deal.zip,
      beds: deal.beds,
      baths: deal.baths,
      sqft: deal.sqft,
      year_built: deal.year_built,
      property_type: deal.property_type,
      photos: deal.photo_urls,
      listPrice: deal.list_price,
      mlsListingId: deal.mls_listing_id,
      sourceTags:
        deal.source_type === "WHOLESALER"
          ? ["Wholesale Deal", ...(deal.flagged_for_alert ? ["Deal Alert"] : [])]
          : ["MLS Deal", ...(deal.flagged_for_alert ? ["Deal Alert"] : [])],
      statusLabel: getStatusDisplayLabel(deal),
      initial,
      liveDeal: deal,
    };
  }, [savedRecord, deal]);

  // For live deals, also surface an existing saved record (so detail shows Update Saved Deal)
  const liveSavedRecord: SavedDeal | null = useMemo(() => {
    if (!vm || vm.mode !== "live" || !vm.liveDeal) return null;
    return getByKey(propertyKeyForDeal(vm.liveDeal));
  }, [vm, getByKey]);

  const effectiveSavedRecord = savedRecord ?? liveSavedRecord;

  if (!vm) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Deal not found.</p>
        <Link to="/portal/investor/deals">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  const photos = vm.photos.length > 0 ? vm.photos : [];

  const handlePrevPhoto = () => setCurrentPhotoIndex((p) => (p > 0 ? p - 1 : photos.length - 1));
  const handleNextPhoto = () => setCurrentPhotoIndex((p) => (p < photos.length - 1 ? p + 1 : 0));

  // Snapshot builder used by the underwriting panel
  const buildSnapshot = (u: SavedUnderwriting, notes: string | null): SavedDealSnapshot => {
    if (vm.mode === "live" && vm.liveDeal) {
      return buildSnapshotFromDeal(vm.liveDeal, u, { notes });
    }
    // saved-mode update: re-use prior snapshot scaffolding
    const base = savedRecord!;
    return {
      property_key: base.property_key,
      source_type: base.source_type,
      source_tags: base.source_tags,
      mls_listing_id: base.mls_listing_id,
      address: base.address,
      city: base.city,
      state: base.state,
      zip: base.zip,
      beds: base.beds,
      baths: base.baths,
      sqft: base.sqft,
      year_built: base.year_built,
      property_type: base.property_type,
      list_price_at_save: base.list_price_at_save,
      remarks_snapshot: base.remarks_snapshot,
      photo_urls: base.photo_urls,
      underwriting: u,
      notes,
      evidence_hash_at_save: base.evidence_hash_at_save,
    };
  };

  // Analyzer link with mlsId + source tags + underwriting
  const analyzerHref = (() => {
    const params = new URLSearchParams();
    if (vm.mlsListingId) params.set("mlsId", vm.mlsListingId);
    params.set("address", vm.address);
    params.set("city", vm.city);
    params.set("zip", vm.zip);
    if (vm.beds != null) params.set("beds", String(vm.beds));
    if (vm.baths != null) params.set("baths", String(vm.baths));
    if (vm.sqft != null) params.set("sqft", String(vm.sqft));
    params.set("price", String(vm.listPrice ?? 0));
    params.set("rent", String(vm.initial.expected_rent ?? 0));
    params.set("arv", String(vm.initial.arv ?? 0));
    if (vm.sourceTags.length) params.set("sourceTags", vm.sourceTags.join(","));
    return `/portal/investor/analyzer?${params.toString()}`;
  })();

  const section8Href = `/portal/investor/section8-calculator?address=${encodeURIComponent(vm.address)}&city=${encodeURIComponent(vm.city)}&zip=${vm.zip}&beds=${vm.beds ?? ""}&rent=${vm.initial.expected_rent ?? 0}`;

  const backHref = vm.mode === "saved" ? "/portal/investor/deals/saved" : "/portal/investor/deals";
  const actionPathBase = vm.mode === "saved" ? `saved/${savedRecord!.id}` : dealId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to={backHref}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {vm.mode === "saved" ? "Saved Deals" : "Deals"}
        </Button>
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
        <div className="aspect-[21/9] bg-muted relative overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={`${vm.address} - Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100" onClick={handlePrevPhoto}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100" onClick={handleNextPhoto}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-xs">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1">
            {vm.sourceTags.map((t) => (
              <Badge key={t} variant="outline" className="bg-background/80 text-xs">
                {t}
              </Badge>
            ))}
          </div>
          <div className="absolute top-4 right-4">
            <Badge className={vm.statusLabel === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
              {vm.statusLabel}
            </Badge>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-b border-border">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2",
                  index === currentPhotoIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <img src={photo} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-1">{vm.address}</h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {vm.city}, {vm.state} {vm.zip}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                {vm.mode === "saved" ? "List @ save" : "Asking Price"}
              </p>
              <p className="font-serif text-3xl font-medium text-foreground">
                {formatCurrency(vm.listPrice || 0)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {vm.beds != null && (
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" /> {vm.beds} Bedrooms
              </span>
            )}
            {vm.baths != null && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" /> {vm.baths} Bathrooms
              </span>
            )}
            {vm.sqft != null && (
              <span className="flex items-center gap-1">
                <Square className="w-4 h-4" /> {vm.sqft.toLocaleString()} sq ft
              </span>
            )}
            {vm.property_type && (
              <span className="flex items-center gap-1">
                <Home className="w-4 h-4" /> {vm.property_type}
              </span>
            )}
            {vm.year_built && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Built {vm.year_built}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Underwriting workspace (replaces the read-only financial snapshot) */}
      <DealUnderwritingPanel
        listPrice={vm.listPrice || 0}
        initial={vm.initial}
        savedRecord={effectiveSavedRecord}
        buildSnapshot={buildSnapshot}
        canCreate={vm.mode === "live"}
      />

      {/* Check MLS Updates — saved view only, only when MLS-linked */}
      {vm.mode === "saved" && vm.mlsListingId && (
        <CheckMlsUpdatesButton
          mlsListingId={vm.mlsListingId}
          savedListPrice={savedRecord?.list_price_at_save ?? null}
        />
      )}

      {/* Take Action */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">Take Action</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={`/portal/investor/deals/${actionPathBase}/offer`}>
            <Button className="w-full" size="lg">
              <FileSignature className="w-4 h-4 mr-2" />
              Submit Offer
            </Button>
          </Link>
          <Link to={`/portal/investor/deals/${actionPathBase}/bid`}>
            <Button variant="outline" className="w-full" size="lg">
              <Wrench className="w-4 h-4 mr-2" />
              Request Walkthrough / Bid
            </Button>
          </Link>
          <Link to={`/portal/investor/deals/${actionPathBase}/consult`}>
            <Button variant="outline" className="w-full" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Request Paid Consult
            </Button>
          </Link>
          <Link to={`/portal/investor/consulting?deal=${actionPathBase}`}>
            <Button variant="outline" className="w-full" size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Analyzer */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">Analyze This Deal</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Run this property through our manual analysis tools with pre-filled values.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to={analyzerHref}>
            <Button variant="secondary" className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              Open in Deal Analyzer
            </Button>
          </Link>
          <Link to={section8Href}>
            <Button variant="secondary" className="w-full" size="lg">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Open in Section 8 Calculator
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> All figures are estimates provided for informational
          purposes only. Investors must independently verify all information including property condition, title status,
          rental rates, repair costs, and financial projections. Integrity Realty STL does not guarantee the accuracy of
          any information or the availability of this property.
        </p>
      </div>
    </div>
  );
};

export default PortalDealDetail;
