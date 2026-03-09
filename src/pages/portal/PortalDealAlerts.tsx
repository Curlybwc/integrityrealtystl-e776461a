import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Filter,
  Search,
  Bed,
  Bath,
  MapPin,
  ArrowLeft,
  Bell,
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
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency, formatPercent, getStatusDisplayLabel } from "@/lib/screening";

const statusColors = {
  Active: "bg-green-100 text-green-800",
  Available: "bg-green-100 text-green-800",
  "Under Contract": "bg-yellow-100 text-yellow-800",
  Sold: "bg-red-100 text-red-800",
  Unknown: "bg-muted text-muted-foreground",
};

const PortalDealAlerts = () => {
  const { deals, isLoading } = useDeals();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");

  // Filter to flagged deals only that are buyer visible
  const alertDeals = deals.filter(d => d.flagged_for_alert && d.buyer_visible);
  
  const filteredDeals = alertDeals.filter((deal) => {
    const matchesSearch =
      deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.zip.includes(searchQuery);

    const matchesSource = 
      sourceFilter === "all" || 
      deal.source_type === sourceFilter;
    
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under50k" && deal.list_price < 50000) ||
      (priceFilter === "50k-75k" && deal.list_price >= 50000 && deal.list_price < 75000) ||
      (priceFilter === "75k-100k" && deal.list_price >= 75000 && deal.list_price < 100000) ||
      (priceFilter === "over100k" && deal.list_price >= 100000);

    return matchesSearch && matchesSource && matchesPrice;
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
        <Link to="/portal/investor/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-1 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Deal Alerts
          </h1>
          <p className="text-muted-foreground text-sm">
            Hot deals flagged for immediate attention. These are high-priority opportunities from both MLS and wholesalers.
          </p>
        </div>
      </div>

      {/* Alert banner */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-3">
        <Bell className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Want instant notifications?
          </p>
          <p className="text-xs text-muted-foreground">
            Contact us to subscribe to SMS deal alerts and get notified the moment new hot deals are added.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search address, city, ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="MLS">MLS Only</SelectItem>
              <SelectItem value="WHOLESALER">Wholesaler Only</SelectItem>
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
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredDeals.length} of {alertDeals.length} deal alerts
      </p>

      {/* Deals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => {
          const displayStatus = getStatusDisplayLabel(deal);
          const statusColor = statusColors[displayStatus as keyof typeof statusColors] || statusColors.Unknown;
          const isWholesaler = deal.source_type === "WHOLESALER";

          return (
            <Link
              key={deal.id}
              to={`/portal/investor/deals/${deal.id}`}
              className="group"
            >
              <div className="bg-card border-2 border-primary/50 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover hover:border-primary transition-all">
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
                      {isWholesaler ? (
                        <Store className="w-12 h-12 text-muted-foreground/30" />
                      ) : (
                        <Building2 className="w-12 h-12 text-muted-foreground/30" />
                      )}
                    </div>
                  )}
                  {/* Deal Alert banner */}
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-red-500/90 to-red-500/0 py-2 px-3">
                    <Badge variant="destructive" className="text-xs">
                      🔥 Deal Alert
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1">
                    {deal.passes_flip && <Badge variant="outline" className="bg-background/80 text-xs">Flip</Badge>}
                    {deal.passes_brrrr && <Badge variant="secondary" className="text-xs">BRRRR</Badge>}
                    {deal.passes_turnkey && <Badge variant="default" className="text-xs">Turnkey</Badge>}
                    {isWholesaler && (
                      <Badge variant="outline" className="bg-background/80 text-xs">
                        Wholesaler
                      </Badge>
                    )}
                  </div>
                  {/* Status badge */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className={statusColor}>
                      {displayStatus}
                    </Badge>
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

                  {/* Metrics Row */}
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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Asking</p>
                      <p className="font-serif text-lg font-medium text-foreground">
                        {formatCurrency(deal.list_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Est. Rent</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(deal.rent_effective)}/mo
                      </p>
                    </div>
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
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No deal alerts at this time.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back soon or browse other deals in the hub.
          </p>
          <Link to="/portal/investor/deals">
            <Button variant="link">Back to Deals Hub</Button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> Deal alerts are flagged by our team 
          for time-sensitive opportunities. Availability may change quickly. Act fast and verify all 
          information independently.
        </p>
      </div>
    </div>
  );
};

export default PortalDealAlerts;
