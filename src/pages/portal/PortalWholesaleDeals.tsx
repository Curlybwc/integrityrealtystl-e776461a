import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Filter,
  Search,
  Bed,
  Bath,
  MapPin,
  ArrowLeft,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency, formatPercent, getStatusDisplayLabel, getScoringStatus } from "@/lib/screening";

const strategyColors = {
  Both: "bg-primary text-primary-foreground",
  Turnkey: "bg-secondary text-secondary-foreground",
  BRRRR: "bg-accent text-accent-foreground",
  None: "bg-muted text-muted-foreground",
};

const statusColors = {
  Available: "bg-green-100 text-green-800",
  "Under Contract": "bg-yellow-100 text-yellow-800",
  Sold: "bg-red-100 text-red-800",
  Unknown: "bg-muted text-muted-foreground",
};

const PortalWholesaleDeals = () => {
  const { deals, isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("All");
  const [priceFilter, setPriceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPassingOnly, setShowPassingOnly] = useState(false);

  // Filter to WHOLESALER deals only - show all that aren't sold
  const wholesaleDeals = deals.filter(d => 
    d.source_type === "WHOLESALER" && 
    d.wholesaler_status !== "Sold"
  );
  
  const filteredDeals = wholesaleDeals.filter((deal) => {
    const matchesSearch =
      deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.zip.includes(searchQuery);

    const scoringStatus = getScoringStatus(deal);
    
    // Strategy filter logic
    const matchesStrategy = 
      strategyFilter === "All" || 
      deal.strategy === strategyFilter ||
      (strategyFilter === "Unscored" && !scoringStatus.isScored);
    
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under50k" && deal.list_price < 50000) ||
      (priceFilter === "50k-75k" && deal.list_price >= 50000 && deal.list_price < 75000) ||
      (priceFilter === "75k-100k" && deal.list_price >= 75000 && deal.list_price < 100000) ||
      (priceFilter === "over100k" && deal.list_price >= 100000);

    const displayStatus = getStatusDisplayLabel(deal);
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "available" && displayStatus === "Available") ||
      (statusFilter === "under-contract" && displayStatus === "Under Contract");

    // "Show only passing" filter - only show deals that pass at least one strategy
    const matchesPassingFilter = !showPassingOnly || 
      (scoringStatus.isScored && deal.strategy !== "None");

    return matchesSearch && matchesStrategy && matchesPrice && matchesStatus && matchesPassingFilter;
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading deals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/portal/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1">Wholesaler Deals</h1>
          <p className="text-muted-foreground text-sm">
            Off-market opportunities from approved wholesalers. Assignment deals before they hit market.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address, city, ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={strategyFilter} onValueChange={setStrategyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Strategies</SelectItem>
              <SelectItem value="Both">Both (Turnkey + BRRRR)</SelectItem>
              <SelectItem value="Turnkey">Turnkey Only</SelectItem>
              <SelectItem value="BRRRR">BRRRR Only</SelectItem>
              <SelectItem value="Unscored">Not Yet Scored</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under50k">Under $50,000</SelectItem>
              <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
              <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
              <SelectItem value="over100k">Over $100,000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="under-contract">Under Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Show only passing toggle */}
        <div className="col-span-full flex items-center gap-2 pt-2 border-t border-border">
          <Switch
            id="passing-only"
            checked={showPassingOnly}
            onCheckedChange={setShowPassingOnly}
          />
          <Label htmlFor="passing-only" className="text-sm text-muted-foreground cursor-pointer">
            Show only deals that pass screening
          </Label>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredDeals.length} of {wholesaleDeals.length} wholesaler deals
      </p>

      {/* Deals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => {
          const displayStatus = getStatusDisplayLabel(deal);
          const statusColor = statusColors[displayStatus as keyof typeof statusColors] || statusColors.Unknown;
          const scoringStatus = getScoringStatus(deal);
          
          // Determine strategy badge styling
          let strategyBadgeClass = "bg-muted/50 text-muted-foreground";
          let strategyLabel = scoringStatus.label;
          
          if (scoringStatus.isScored && deal.strategy !== "None") {
            strategyBadgeClass = strategyColors[deal.strategy as keyof typeof strategyColors];
            strategyLabel = deal.strategy;
          } else if (!scoringStatus.isScored) {
            strategyBadgeClass = "bg-orange-100 text-orange-800";
          }

          return (
            <Link
              key={deal.id}
              to={`/portal/deals/${deal.id}`}
              className="group"
            >
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                {/* Image */}
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {deal.photo_urls.length > 0 ? (
                    <img
                      src={deal.photo_urls[0]}
                      alt={deal.address}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Store className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Strategy badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={strategyBadgeClass}>
                      {strategyLabel}
                    </Badge>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={statusColor}>
                      {displayStatus}
                    </Badge>
                  </div>
                  {/* Wholesaler indicator */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <Badge variant="outline" className="bg-background/80 text-xs">
                      Wholesaler
                    </Badge>
                    {deal.flagged_for_alert && (
                      <Badge variant="destructive" className="text-xs">
                        🔥 Deal Alert
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {deal.address}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {deal.city}, {deal.zip}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      {deal.beds} bed
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      {deal.baths} bath
                    </span>
                    <span>{deal.sqft?.toLocaleString()} sqft</span>
                  </div>

                  {/* Metrics Row - show if scored, otherwise explain why not */}
                  {scoringStatus.isScored ? (
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border mb-3">
                      <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">Rent/Price</p>
                        <p className={`text-sm font-semibold ${deal.rent_to_price_pct >= 0.0135 ? "text-green-600" : "text-foreground"}`}>
                          {formatPercent(deal.rent_to_price_pct)}
                        </p>
                      </div>
                      <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">All-In % ARV</p>
                        <p className={`text-sm font-semibold ${deal.all_in_pct_of_arv <= 0.75 ? "text-green-600" : "text-foreground"}`}>
                          {formatPercent(deal.all_in_pct_of_arv)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-border mb-3">
                      <p className="text-xs text-muted-foreground text-center italic">
                        Missing: {scoringStatus.missingFields.join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Asking</p>
                      <p className="font-serif text-lg font-medium text-foreground">
                        {formatCurrency(deal.list_price)}
                      </p>
                    </div>
                    {scoringStatus.isScored && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Est. Rent</p>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(deal.rent_effective)}/mo
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No wholesaler deals match your filters.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setStrategyFilter("All");
              setPriceFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> Wholesaler deals are assignment contracts. 
          Assignment fee is typically included in the asking price. Buyers should verify all property 
          information and consult with their own advisors before making offers.
        </p>
      </div>
    </div>
  );
};

export default PortalWholesaleDeals;
