import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/screening";
import { toast } from "@/hooks/use-toast";

interface LiveSnapshot {
  list_price?: number;
  mls_status?: string;
  days_on_market?: number;
  photo_urls?: string[];
  remarks?: string;
}

interface Props {
  mlsListingId: string;
  savedListPrice: number | null;
  savedStatusHint?: string | null;
}

/**
 * Read-only Repliers refresh: shows current list price/status/DOM next to the saved snapshot.
 * Never overwrites saved underwriting and never re-runs AI.
 */
const CheckMlsUpdatesButton = ({ mlsListingId, savedListPrice }: Props) => {
  const [loading, setLoading] = useState(false);
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);

  const onClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-mls-listings", {
        body: { mlsNumber: mlsListingId },
      });
      if (error) throw error;
      const listing = (data?.listings ?? [])[0];
      if (!listing) {
        toast({ title: "MLS lookup returned no listing", variant: "destructive" });
        return;
      }
      setSnap({
        list_price: listing.list_price,
        mls_status: listing.mls_status,
        days_on_market: listing.days_on_market,
        photo_urls: listing.photo_urls,
        remarks: listing.remarks,
      });
    } catch (e: unknown) {
      toast({
        title: "MLS lookup failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const priceDelta =
    snap?.list_price != null && savedListPrice != null ? snap.list_price - savedListPrice : null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground text-sm">Check MLS Updates</h3>
          <p className="text-xs text-muted-foreground">
            Refresh price, status, and DOM from the MLS. Your saved underwriting will not be changed.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClick} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Check now
        </Button>
      </div>
      {snap && (
        <div className="mt-3 grid sm:grid-cols-4 gap-2 text-xs">
          <Chip label="Live status" value={snap.mls_status ?? "—"} />
          <Chip
            label="Live price"
            value={snap.list_price != null ? formatCurrency(snap.list_price) : "—"}
          />
          <Chip label="DOM" value={snap.days_on_market != null ? String(snap.days_on_market) : "—"} />
          <Chip label="Photos" value={String(snap.photo_urls?.length ?? 0)} />
          {priceDelta != null && priceDelta !== 0 && (
            <div className="sm:col-span-4">
              <Badge variant={priceDelta < 0 ? "default" : "secondary"} className="text-xs">
                Price change since save: {priceDelta < 0 ? "−" : "+"}
                {formatCurrency(Math.abs(priceDelta))}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Chip = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-border bg-muted/40 px-2 py-1.5">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="font-mono text-foreground">{value}</p>
  </div>
);

export default CheckMlsUpdatesButton;
