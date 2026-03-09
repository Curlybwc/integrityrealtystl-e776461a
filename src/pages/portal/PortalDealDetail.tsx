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
  Users,
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
import { useState } from "react";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency, formatPercent, getStatusDisplayLabel } from "@/lib/screening";
import { cn } from "@/lib/utils";

const PortalDealDetail = () => {
  const { dealId } = useParams();
  const { getDealById } = useDeals();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const deal = getDealById(dealId || "");

  if (!deal || !deal.buyer_visible) {
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

  const photos = deal.photo_urls.length > 0 ? deal.photo_urls : [];
  const displayStatus = getStatusDisplayLabel(deal);

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/portal/investor/deals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
        {/* Photo gallery */}
        <div className="aspect-[21/9] bg-muted relative overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={`${deal.address} - Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                    onClick={handlePrevPhoto}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                    onClick={handleNextPhoto}
                  >
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
          <div className="absolute top-4 left-4 flex gap-1">
            {deal.passes_flip && <Badge variant="outline" className="bg-background/80 text-xs">Flip</Badge>}
            {deal.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
            {deal.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
            {deal.source_type === "WHOLESALER" && (
              <Badge variant="outline" className="bg-background/80">
                Wholesaler
              </Badge>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <Badge className={displayStatus === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
              {displayStatus}
            </Badge>
          </div>
        </div>

        {/* Photo thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-b border-border">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2",
                  index === currentPhotoIndex
                    ? "border-primary"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={photo}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Property overview */}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-1">
                {deal.address}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {deal.city}, {deal.state} {deal.zip}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Asking Price</p>
              <p className="font-serif text-3xl font-medium text-foreground">
                {formatCurrency(deal.list_price)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {deal.beds} Bedrooms
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {deal.baths} Bathrooms
            </span>
            <span className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              {deal.sqft?.toLocaleString()} sq ft
            </span>
            <span className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              {deal.property_type}
            </span>
            {deal.year_built && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Built {deal.year_built}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">
          Financial Snapshot
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          All figures are estimates provided for informational purposes only. 
          Investors must independently verify all information.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
            <p className="font-serif text-xl font-medium text-foreground">
              {formatCurrency(deal.list_price)}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Rehab ({deal.rehab_tier_effective})</p>
            <p className="font-serif text-xl font-medium text-foreground">
              {formatCurrency(deal.rehab_est_effective)}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. ARV</p>
            <p className="font-serif text-xl font-medium text-foreground">
              {formatCurrency(deal.arv_effective)}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Rent</p>
            <p className="font-serif text-xl font-medium text-foreground">
              {formatCurrency(deal.rent_effective)}/mo
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className={cn(
            "rounded-lg p-4 border",
            deal.rent_to_price_pct >= 0.0135 ? "bg-green-50 border-green-200" : "bg-muted border-border"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Rent-to-Price Ratio</p>
            <p className={cn(
              "font-serif text-2xl font-medium",
              deal.rent_to_price_pct >= 0.0135 ? "text-green-700" : "text-foreground"
            )}>
              {formatPercent(deal.rent_to_price_pct)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Target: ≥ 1.35% for Turnkey, ≥ 1.30% for BRRRR
            </p>
          </div>
          <div className={cn(
            "rounded-lg p-4 border",
            deal.all_in_pct_of_arv <= 0.75 ? "bg-green-50 border-green-200" : "bg-muted border-border"
          )}>
            <p className="text-xs text-muted-foreground mb-1">All-In % of ARV</p>
            <p className={cn(
              "font-serif text-2xl font-medium",
              deal.all_in_pct_of_arv <= 0.75 ? "text-green-700" : "text-foreground"
            )}>
              {formatPercent(deal.all_in_pct_of_arv)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Target: ≤ 75% for BRRRR
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">
          Take Action
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={`/portal/investor/deals/${deal.id}/offer`}>
            <Button className="w-full" size="lg">
              <FileSignature className="w-4 h-4 mr-2" />
              Submit Offer
            </Button>
          </Link>
          <Link to={`/portal/investor/deals/${deal.id}/bid`}>
            <Button variant="outline" className="w-full" size="lg">
              <Wrench className="w-4 h-4 mr-2" />
              Request Walkthrough / Bid
            </Button>
          </Link>
          <Link to={`/portal/investor/deals/${deal.id}/consult`}>
            <Button variant="outline" className="w-full" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Request Paid Consult
            </Button>
          </Link>
          <Link to={`/portal/investor/consulting?deal=${deal.id}`}>
            <Button variant="outline" className="w-full" size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Analyzer Tools */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">
          Analyze This Deal
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Run this property through our analysis tools with pre-filled data.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to={`/portal/investor/analyzer?address=${encodeURIComponent(deal.address)}&city=${encodeURIComponent(deal.city)}&zip=${deal.zip}&beds=${deal.beds}&baths=${deal.baths}&sqft=${deal.sqft}&price=${deal.list_price}&rent=${deal.rent_effective}&arv=${deal.arv_effective}`}
          >
            <Button variant="secondary" className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              Open in Deal Analyzer
            </Button>
          </Link>
          <Link
            to={`/portal/investor/section8-calculator?address=${encodeURIComponent(deal.address)}&city=${encodeURIComponent(deal.city)}&zip=${deal.zip}&beds=${deal.beds}&rent=${deal.rent_effective}`}
          >
            <Button variant="secondary" className="w-full" size="lg">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Open in Section 8 Calculator
            </Button>
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> All figures are estimates 
          provided for informational purposes only. Investors must independently verify all 
          information including but not limited to property condition, title status, rental 
          rates, repair costs, and financial projections. Integrity Realty STL does not 
          guarantee the accuracy of any information or the availability of this property.
          {deal.source_type === "WHOLESALER" && (
            <> This property information was submitted by a third-party wholesaler. 
            Integrity Realty STL has not independently verified condition, financial 
            estimates, or availability.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default PortalDealDetail;
