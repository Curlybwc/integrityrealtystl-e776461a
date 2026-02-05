import { useState, useCallback, useEffect } from "react";
import { Deal, updateDeal, RehabTier } from "@/lib/screening";
import { loadDeals, saveDeals, resetDeals } from "@/data/mockDeals";

export type DealTab = "unreviewed" | "reviewed" | "removed" | "archived";

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load deals on mount
  useEffect(() => {
    setDeals(loadDeals());
    setIsLoading(false);
  }, []);

  // Save deals whenever they change
  useEffect(() => {
    if (!isLoading && deals.length > 0) {
      saveDeals(deals);
    }
  }, [deals, isLoading]);

  // Get deals by tab
  const getDealsByTab = useCallback((tab: DealTab): Deal[] => {
    switch (tab) {
      case "unreviewed":
        return deals.filter(d => d.buyer_visible && !d.reviewed);
      case "reviewed":
        return deals.filter(d => d.buyer_visible && d.reviewed);
      case "removed":
        return deals.filter(d => d.removed_reason !== undefined && d.removed_reason !== null);
      case "archived":
        return deals.filter(d => 
          d.mls_status === "Sold" || d.wholesaler_status === "Sold"
        );
      default:
        return [];
    }
  }, [deals]);

  // Get buyer-visible deals
  const getBuyerVisibleDeals = useCallback((strategyFilter?: string): Deal[] => {
    return deals.filter(d => {
      if (!d.buyer_visible) return false;
      if (!strategyFilter || strategyFilter === "All") return true;
      return d.strategy === strategyFilter;
    });
  }, [deals]);

  // Get single deal by ID
  const getDealById = useCallback((id: string): Deal | undefined => {
    return deals.find(d => d.id === id);
  }, [deals]);

  // Mark deal as reviewed
  const markAsReviewed = useCallback((dealId: string) => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId || deal.reviewed) return deal;
      return updateDeal(deal, {
        reviewed: true,
        reviewed_at: new Date().toISOString(),
      });
    }));
  }, []);

  // Update deal override
  const updateDealOverride = useCallback((
    dealId: string, 
    field: "rent_override" | "arv_override" | "rehab_tier_override",
    value: number | RehabTier | undefined
  ) => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal;
      
      const updates: Partial<Deal> = {
        [field]: value,
        reviewed: true,
        reviewed_at: deal.reviewed ? deal.reviewed_at : new Date().toISOString(),
      };
      
      return updateDeal(deal, updates);
    }));
  }, []);

  // Update deal notes
  const updateDealNotes = useCallback((dealId: string, notes: string) => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal;
      return updateDeal(deal, { notes });
    }));
  }, []);

  // Restore removed deal (clear removed_reason)
  const restoreDeal = useCallback((dealId: string) => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal;
      return updateDeal(deal, { removed_reason: undefined });
    }));
  }, []);

  // Reset to mock data
  const resetToMockData = useCallback(() => {
    setDeals(resetDeals());
  }, []);

  return {
    deals,
    isLoading,
    getDealsByTab,
    getBuyerVisibleDeals,
    getDealById,
    markAsReviewed,
    updateDealOverride,
    updateDealNotes,
    restoreDeal,
    resetToMockData,
  };
}
