import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Image, RotateCcw } from "lucide-react";
import { Deal, RehabTier, formatCurrency, formatPercent, getStatusDisplayLabel } from "@/lib/screening";
import { DealPhotoViewer } from "./DealPhotoViewer";
import { cn } from "@/lib/utils";

interface DealPotTableProps {
  deals: Deal[];
  onMarkReviewed: (dealId: string) => void;
  onUpdateRent: (dealId: string, value: number | undefined) => void;
  onUpdateArv: (dealId: string, value: number | undefined) => void;
  onUpdateRehabTier: (dealId: string, value: RehabTier | undefined) => void;
  onUpdateNotes: (dealId: string, notes: string) => void;
  onRestore?: (dealId: string) => void;
  showRestore?: boolean;
}

export function DealPotTable({
  deals,
  onMarkReviewed,
  onUpdateRent,
  onUpdateArv,
  onUpdateRehabTier,
  onUpdateNotes,
  onRestore,
  showRestore = false,
}: DealPotTableProps) {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});

  const handlePhotoClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setPhotoViewerOpen(true);
    onMarkReviewed(deal.id);
  };

  const handlePhotoViewerClose = (open: boolean) => {
    setPhotoViewerOpen(open);
    if (!open) {
      // Refresh selected deal to get updated values
      const updatedDeal = deals.find(d => d.id === selectedDeal?.id);
      if (updatedDeal) {
        setSelectedDeal(updatedDeal);
      }
    }
  };

  const renderStrategyBadges = (deal: Deal) => (
    <div className="flex gap-1 flex-wrap">
      {deal.passes_flip && <Badge variant="outline" className="text-xs">Flip</Badge>}
      {deal.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
      {deal.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
      {!deal.passes_flip && !deal.passes_brrrr && !deal.passes_turnkey && <Badge variant="destructive" className="text-xs">None</Badge>}
    </div>
  );

  const getStatusBadgeVariant = (deal: Deal) => {
    const status = getStatusDisplayLabel(deal);
    switch (status) {
      case "Active": return "default";
      case "Under Contract": return "secondary";
      case "Sold": return "destructive";
      default: return "outline";
    }
  };

  if (deals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No deals in this category.
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Photo</TableHead>
                <TableHead className="min-w-[180px]">Address</TableHead>
                <TableHead className="w-[70px]">ZIP</TableHead>
                <TableHead className="w-[50px]">Beds</TableHead>
                <TableHead className="w-[70px]">Sqft</TableHead>
                <TableHead className="w-[100px]">List Price</TableHead>
                <TableHead className="w-[90px]">Status</TableHead>
                <TableHead className="w-[80px]">Strategy</TableHead>
                <TableHead className="w-[100px]">Rehab</TableHead>
                <TableHead className="w-[100px]">Rent Eff.</TableHead>
                <TableHead className="w-[100px]">ARV Eff.</TableHead>
                <TableHead className="w-[70px]">RTP %</TableHead>
                <TableHead className="w-[80px]">All-In %</TableHead>
                <TableHead className="min-w-[150px]">Notes</TableHead>
                {showRestore && <TableHead className="w-[80px]">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className={cn(
                    !deal.reviewed && "bg-muted/50"
                  )}
                >
                  <TableCell>
                    <button
                      onClick={() => handlePhotoClick(deal)}
                      className="w-12 h-12 rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                    >
                      {deal.photo_urls.length > 0 ? (
                        <img
                          src={deal.photo_urls[0]}
                          alt={deal.address}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Image className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{deal.address}</TableCell>
                  <TableCell>{deal.zip}</TableCell>
                  <TableCell>{deal.beds}</TableCell>
                  <TableCell>{deal.sqft.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(deal.list_price)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(deal)} className="text-xs">
                      {getStatusDisplayLabel(deal)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {renderStrategyBadges(deal)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={deal.rehab_tier_override ?? "system"}
                      onValueChange={(value) => {
                        onUpdateRehabTier(deal.id, value === "system" ? undefined : value as RehabTier);
                        onMarkReviewed(deal.id);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">{deal.rehab_tier_system}</SelectItem>
                        <SelectItem value="Light">Light</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-20 text-xs"
                      placeholder={deal.rent_system.toString()}
                      defaultValue={deal.rent_override ?? ""}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        onUpdateRent(deal.id, value ? parseInt(value, 10) : undefined);
                        onMarkReviewed(deal.id);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-24 text-xs"
                      placeholder={deal.arv_system.toString()}
                      defaultValue={deal.arv_override ?? ""}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        onUpdateArv(deal.id, value ? parseInt(value, 10) : undefined);
                        onMarkReviewed(deal.id);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-medium text-xs",
                      deal.rent_to_price_pct >= 0.0135 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatPercent(deal.rent_to_price_pct)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-medium text-xs",
                      deal.all_in_pct_of_arv <= 0.75 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatPercent(deal.all_in_pct_of_arv)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Add notes..."
                      value={editingNotes[deal.id] ?? deal.notes ?? ""}
                      onChange={(e) => setEditingNotes(prev => ({ ...prev, [deal.id]: e.target.value }))}
                      onBlur={(e) => {
                        onUpdateNotes(deal.id, e.target.value);
                        setEditingNotes(prev => {
                          const next = { ...prev };
                          delete next[deal.id];
                          return next;
                        });
                      }}
                    />
                  </TableCell>
                  {showRestore && onRestore && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestore(deal.id)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DealPhotoViewer
        deal={selectedDeal}
        open={photoViewerOpen}
        onOpenChange={handlePhotoViewerClose}
        onUpdateRent={(value) => selectedDeal && onUpdateRent(selectedDeal.id, value)}
        onUpdateArv={(value) => selectedDeal && onUpdateArv(selectedDeal.id, value)}
        onUpdateRehabTier={(value) => selectedDeal && onUpdateRehabTier(selectedDeal.id, value)}
      />
    </>
  );
}
