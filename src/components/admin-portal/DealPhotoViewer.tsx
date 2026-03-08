import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, X, Eye, EyeOff } from "lucide-react";
import { Deal, RehabTier, formatCurrency, formatPercent, getStatusDisplayLabel } from "@/lib/screening";
import { cn } from "@/lib/utils";

interface DealPhotoViewerProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateRent: (value: number | undefined) => void;
  onUpdateArv: (value: number | undefined) => void;
  onUpdateRehabTier: (value: RehabTier | undefined) => void;
}

export function DealPhotoViewer({
  deal,
  open,
  onOpenChange,
  onUpdateRent,
  onUpdateArv,
  onUpdateRehabTier,
}: DealPhotoViewerProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [localRent, setLocalRent] = useState("");
  const [localArv, setLocalArv] = useState("");
  const [localRehabTier, setLocalRehabTier] = useState<RehabTier | "">("");

  // Reset state when deal changes
  useEffect(() => {
    if (deal) {
      setCurrentPhotoIndex(0);
      setLocalRent(deal.rent_override?.toString() ?? "");
      setLocalArv(deal.arv_override?.toString() ?? "");
      setLocalRehabTier(deal.rehab_tier_override ?? "");
    }
  }, [deal]);

  if (!deal) return null;

  const photos = deal.photo_urls.length > 0 ? deal.photo_urls : ["/placeholder.svg"];

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleRentBlur = () => {
    const value = localRent.trim();
    onUpdateRent(value ? parseInt(value, 10) : undefined);
  };

  const handleArvBlur = () => {
    const value = localArv.trim();
    onUpdateArv(value ? parseInt(value, 10) : undefined);
  };

  const handleRehabTierChange = (value: string) => {
    if (value === "system") {
      setLocalRehabTier("");
      onUpdateRehabTier(undefined);
    } else {
      setLocalRehabTier(value as RehabTier);
      onUpdateRehabTier(value as RehabTier);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{deal.address}</span>
            <Badge variant={deal.buyer_visible ? "default" : "secondary"}>
              {deal.buyer_visible ? (
                <><Eye className="w-3 h-3 mr-1" /> Visible</>
              ) : (
                <><EyeOff className="w-3 h-3 mr-1" /> Hidden</>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo Carousel */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={photos[currentPhotoIndex]}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {photos.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                    onClick={handlePrevPhoto}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
                    onClick={handleNextPhoto}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-1 rounded text-xs">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>

            {/* Photo Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
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

            {/* Property Info */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">ZIP:</span> {deal.zip}</div>
              <div><span className="text-muted-foreground">Beds:</span> {deal.beds}</div>
              <div><span className="text-muted-foreground">Sqft:</span> {deal.sqft.toLocaleString()}</div>
              <div><span className="text-muted-foreground">Status:</span> {getStatusDisplayLabel(deal)}</div>
              <div className="col-span-2">
                <span className="text-muted-foreground">List Price:</span>{" "}
                <span className="font-semibold">{formatCurrency(deal.list_price)}</span>
              </div>
            </div>
          </div>

          {/* Quick Edit Panel */}
          <div className="space-y-6">
            {/* Strategy Results */}
            <div className="space-y-3">
              <h3 className="font-medium">Screening Results</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className={cn(
                  "p-3 rounded-lg border",
                  deal.passes_flip ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2">
                    {deal.passes_flip ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">Flip</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All-In ≤ 75% ARV
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  deal.passes_brrrr ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2">
                    {deal.passes_brrrr ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">BRRRR</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Flip + RTP ≥ 1.30%
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border",
                  deal.passes_turnkey ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2">
                    {deal.passes_turnkey ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">Turnkey</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    RTP ≥ 1.35%, Turnkey tier
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <h3 className="font-medium">Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Rent/Price</span>
                  <div className={cn(
                    "font-semibold",
                    deal.rent_to_price_pct >= 0.0135 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercent(deal.rent_to_price_pct)}
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">All-In % ARV</span>
                  <div className={cn(
                    "font-semibold",
                    deal.all_in_pct_of_arv <= 0.75 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercent(deal.all_in_pct_of_arv)}
                  </div>
                </div>
              </div>
            </div>

            {/* Override Inputs */}
            <div className="space-y-4">
              <h3 className="font-medium">Override Values</h3>
              
              <div className="space-y-2">
                <Label htmlFor="rehab-tier">Rehab Tier</Label>
                <Select 
                  value={localRehabTier || "system"} 
                  onValueChange={handleRehabTierChange}
                >
                  <SelectTrigger id="rehab-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">
                      System: {deal.rehab_tier_system}
                    </SelectItem>
                    <SelectItem value="Light">Light ($15/sf)</SelectItem>
                    <SelectItem value="Medium">Medium ($30/sf)</SelectItem>
                    <SelectItem value="Heavy">Heavy ($50/sf)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Effective: {deal.rehab_tier_effective} • Est: {formatCurrency(deal.rehab_est_effective)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent-override">Rent Override</Label>
                <Input
                  id="rent-override"
                  type="number"
                  placeholder={`System: ${formatCurrency(deal.rent_system)}`}
                  value={localRent}
                  onChange={(e) => setLocalRent(e.target.value)}
                  onBlur={handleRentBlur}
                />
                <p className="text-xs text-muted-foreground">
                  Effective: {formatCurrency(deal.rent_effective)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arv-override">ARV Override</Label>
                <Input
                  id="arv-override"
                  type="number"
                  placeholder={`System: ${formatCurrency(deal.arv_system)}`}
                  value={localArv}
                  onChange={(e) => setLocalArv(e.target.value)}
                  onBlur={handleArvBlur}
                />
                <p className="text-xs text-muted-foreground">
                  Effective: {formatCurrency(deal.arv_effective)}
                </p>
              </div>
            </div>

            {/* Notes */}
            {deal.notes && (
              <div className="space-y-2">
                <h3 className="font-medium">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {deal.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
