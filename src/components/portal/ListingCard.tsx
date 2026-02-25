import { Link } from "react-router-dom";
import { Camera, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatCurrency, formatPercent } from "@/lib/screening";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: {
    mls_listing_id: string;
    address: string;
    city: string;
    zip: string;
    list_price: number;
    beds: number;
    baths: number;
    sqft: number;
    photo_urls: string[];
    rent_effective: number;
    arv_effective: number;
    rent_to_price_pct: number;
    all_in_pct_of_arv: number;
    passes_turnkey: boolean;
    passes_brrrr: boolean;
    passes_flip: boolean;
  };
  onPhotoClick: () => void;
}

const ListingCard = ({ listing: l, onPhotoClick }: ListingCardProps) => {
  const passes = l.passes_turnkey || l.passes_brrrr || l.passes_flip;
  const hasPhotos = l.photo_urls && l.photo_urls.length > 0;

  return (
    <Card className={cn("overflow-hidden transition-opacity", !passes && "opacity-50")}>
      {/* Photo area */}
      <div className="relative cursor-pointer" onClick={hasPhotos ? onPhotoClick : undefined}>
        <AspectRatio ratio={16 / 10}>
          {hasPhotos ? (
            <img
              src={l.photo_urls[0]}
              alt={l.address}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </AspectRatio>
        {/* Strategy badge overlay */}
        <div className="absolute top-2 left-2 flex gap-1">
          {l.passes_flip && <Badge variant="outline" className="text-xs">Flip</Badge>}
          {l.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
          {l.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
        </div>
        {hasPhotos && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Camera className="h-3 w-3" />
            {l.photo_urls.length}
          </span>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Address */}
        <div>
          <p className="text-sm font-medium leading-tight truncate">{l.address}</p>
          <p className="text-xs text-muted-foreground">{l.city}, {l.zip}</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span className="font-medium">{formatCurrency(l.list_price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bd/Ba/Sf</span>
            <span className="font-medium">{l.beds}/{l.baths}/{l.sqft?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Rent</span>
            <span className="font-medium">{formatCurrency(l.rent_effective)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ARV</span>
            <span className="font-medium">{formatCurrency(l.arv_effective)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RTP Ratio</span>
            <span className={cn(
              "font-medium",
              l.rent_to_price_pct >= 0.013 ? "text-green-600" : l.rent_to_price_pct >= 0.01 ? "text-orange-500" : "text-destructive"
            )}>
              {formatPercent(l.rent_to_price_pct)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">All-In%</span>
            <span className={cn(
              "font-medium",
              l.all_in_pct_of_arv <= 0.75 ? "text-green-600" : l.all_in_pct_of_arv <= 0.80 ? "text-orange-500" : "text-destructive"
            )}>
              {formatPercent(l.all_in_pct_of_arv)}
            </span>
          </div>
        </div>

        {/* Analyze link */}
        <Link
          to={`/portal/analyzer?address=${encodeURIComponent(l.address)}&zip=${l.zip}&beds=${l.beds}&baths=${l.baths}&sqft=${l.sqft}&price=${l.list_price}`}
          className="block"
        >
          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            Analyze
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
