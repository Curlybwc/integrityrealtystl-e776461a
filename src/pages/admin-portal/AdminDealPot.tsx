import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { DealPotTable } from "@/components/admin-portal/DealPotTable";
import { useDeals, DealTab } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";

const AdminDealPot = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as DealTab) || "unreviewed";
  const [activeTab, setActiveTab] = useState<DealTab>(initialTab);
  const { toast } = useToast();
  
  const {
    getDealsByTab,
    markAsReviewed,
    updateDealOverride,
    updateDealNotes,
    restoreDeal,
    resetToMockData,
  } = useDeals();

  const handleTabChange = (value: string) => {
    setActiveTab(value as DealTab);
    setSearchParams({ tab: value });
  };

  const handleReset = () => {
    resetToMockData();
    toast({
      title: "Data Reset",
      description: "Mock data has been restored.",
    });
  };

  const unreviewedDeals = getDealsByTab("unreviewed");
  const reviewedDeals = getDealsByTab("reviewed");
  const removedDeals = getDealsByTab("removed");
  const archivedDeals = getDealsByTab("archived");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-foreground">
            Deal Pot
          </h1>
          <p className="text-muted-foreground">
            Review and manage MLS and wholesaler deals
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Demo Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="unreviewed" className="gap-2">
            Unreviewed
            <Badge variant="secondary" className="ml-1">
              {unreviewedDeals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="gap-2">
            Reviewed
            <Badge variant="secondary" className="ml-1">
              {reviewedDeals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="removed" className="gap-2">
            Removed
            <Badge variant="secondary" className="ml-1">
              {removedDeals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            Archived
            <Badge variant="secondary" className="ml-1">
              {archivedDeals.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 text-sm text-muted-foreground">
          {activeTab === "unreviewed" && (
            <p>
              Passing deals that need admin review. Gray rows indicate unreviewed deals.
              Click a photo or edit any field to mark as reviewed.
            </p>
          )}
          {activeTab === "reviewed" && (
            <p>
              Passing deals that have been reviewed and are visible to buyers.
            </p>
          )}
          {activeTab === "removed" && (
            <p>
              Deals that failed screening after admin overrides. These are hidden from buyers.
            </p>
          )}
          {activeTab === "archived" && (
            <p>
              Sold deals from MLS or wholesaler sources. These are no longer active.
            </p>
          )}
        </div>

        <TabsContent value="unreviewed" className="mt-6">
          <DealPotTable
            deals={unreviewedDeals}
            onMarkReviewed={markAsReviewed}
            onUpdateRent={(id, val) => updateDealOverride(id, "rent_override", val)}
            onUpdateArv={(id, val) => updateDealOverride(id, "arv_override", val)}
            onUpdateRehabTier={(id, val) => updateDealOverride(id, "rehab_tier_override", val)}
            onUpdateNotes={updateDealNotes}
          />
        </TabsContent>

        <TabsContent value="reviewed" className="mt-6">
          <DealPotTable
            deals={reviewedDeals}
            onMarkReviewed={markAsReviewed}
            onUpdateRent={(id, val) => updateDealOverride(id, "rent_override", val)}
            onUpdateArv={(id, val) => updateDealOverride(id, "arv_override", val)}
            onUpdateRehabTier={(id, val) => updateDealOverride(id, "rehab_tier_override", val)}
            onUpdateNotes={updateDealNotes}
          />
        </TabsContent>

        <TabsContent value="removed" className="mt-6">
          <DealPotTable
            deals={removedDeals}
            onMarkReviewed={markAsReviewed}
            onUpdateRent={(id, val) => updateDealOverride(id, "rent_override", val)}
            onUpdateArv={(id, val) => updateDealOverride(id, "arv_override", val)}
            onUpdateRehabTier={(id, val) => updateDealOverride(id, "rehab_tier_override", val)}
            onUpdateNotes={updateDealNotes}
            onRestore={restoreDeal}
            showRestore
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <DealPotTable
            deals={archivedDeals}
            onMarkReviewed={markAsReviewed}
            onUpdateRent={(id, val) => updateDealOverride(id, "rent_override", val)}
            onUpdateArv={(id, val) => updateDealOverride(id, "arv_override", val)}
            onUpdateRehabTier={(id, val) => updateDealOverride(id, "rehab_tier_override", val)}
            onUpdateNotes={updateDealNotes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDealPot;
