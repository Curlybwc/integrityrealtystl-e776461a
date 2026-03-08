import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  ArrowLeft,
  Bed,
  Bath,
  Ruler,
  Clock,
  Phone,
  Mail,
  Building2,
  User,
} from "lucide-react";
import { formatCurrency } from "@/lib/screening";

export interface RawListing {
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

interface ListingDetailBaseProps {
  listing: RawListing;
  onBack: () => void;
  children?: React.ReactNode;
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "" || value === 0) return null;
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

const ListingDetailBase = ({ listing, onBack, children }: ListingDetailBaseProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const raw = listing.raw ?? {};
  const details = raw.details ?? {};
  const agentRaw = raw.agents ?? {};
  const agent = Array.isArray(agentRaw) ? agentRaw[0] : agentRaw;
  const office = raw.office ?? agent?.office ?? {};
  const photos = listing.photo_urls ?? [];
  const hasPhotos = photos.length > 0;

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" className="gap-1" onClick={onBack}>
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

      {/* Slot for additional sections (e.g. investor analysis) */}
      {children}
    </div>
  );
};

export default ListingDetailBase;
