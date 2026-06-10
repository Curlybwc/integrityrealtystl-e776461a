import { Heart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedDeals } from "@/hooks/useSavedDeals";
import { useNavigate } from "react-router-dom";
import { propertyKeyForDeal, buildSnapshotFromDeal, recomputeMetrics, type SavedUnderwriting } from "@/lib/savedDeals";
import type { Deal } from "@/lib/screening";
import { toast } from "@/hooks/use-toast";
import { useAccessTier } from "@/hooks/useAccessTier";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/**
 * Lightweight heart overlay for discovery grid cards.
 * - If not saved: clicking saves a snapshot using the deal's effective underwriting.
 * - If saved: clicking navigates to the saved-deal detail page.
 */
const SaveDealButton = ({ deal, className }: { deal: Deal; className?: string }) => {
  const { isSaved, getByKey, saveDeal, canSave } = useSavedDeals();
  const navigate = useNavigate();
  const { tier, isAdmin } = useAccessTier();

  const key = propertyKeyForDeal(deal);
  const saved = getByKey(key);
  const isOn = !!saved;
  const allowed = isAdmin || tier === "full";

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOn && saved) {
      navigate(`/portal/investor/deals/saved/${saved.id}`);
      return;
    }
    if (!canSave) {
      toast({ title: "Sign in to save deals", variant: "destructive" });
      return;
    }
    try {
      const arv = deal.arv_effective || 0;
      const rent = deal.rent_effective || 0;
      const repairs = deal.rehab_est_effective || 0;
      const metrics = recomputeMetrics(deal.list_price || 0, arv, rent, repairs);
      const underwriting: SavedUnderwriting = {
        arv,
        expected_rent: rent,
        total_repairs: repairs,
        repair_breakdown: null,
        ...metrics,
      };
      await saveDeal(buildSnapshotFromDeal(deal, underwriting));
      toast({ title: "Saved to My Saved Deals" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save deal";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  if (!allowed && !isOn) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Locked — sign your Buyer's Agency Agreement to save deals"
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center backdrop-blur bg-background/80 hover:bg-background border border-border shadow-sm transition-colors",
              className,
            )}
          >
            <Lock className="w-4 h-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Saving deals requires full access</p>
            <p className="text-xs text-muted-foreground">
              Complete your profile and sign your Buyer's Agency Agreement to save deals to your portfolio.
            </p>
            <Button size="sm" className="w-full" onClick={() => navigate("/portal/investor/onboarding")}>
              Complete setup
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isOn ? "Saved — open My Saved Deals" : "Save deal"}
      title={isOn ? "Saved" : "Save deal"}
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center backdrop-blur bg-background/80 hover:bg-background border border-border shadow-sm transition-colors",
        className,
      )}
    >
      <Heart className={cn("w-4 h-4", isOn ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </button>
  );
};

export default SaveDealButton;
