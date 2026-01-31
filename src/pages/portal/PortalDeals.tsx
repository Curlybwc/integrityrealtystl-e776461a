import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Star,
  FileText,
  Filter,
  Search,
  Bed,
  Bath,
  DollarSign,
  MapPin,
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

// Mock deals data
const mockDeals = [
  {
    id: "1",
    type: "jens-pick",
    address: "1234 Oak Street",
    city: "Florissant",
    zip: "63033",
    price: 75000,
    beds: 3,
    baths: 1,
    sqft: 1200,
    estimatedRent: 1100,
    estimatedARV: 110000,
    status: "active",
    dateAdded: "2024-01-15",
    image: null,
  },
  {
    id: "2",
    type: "mls",
    address: "5678 Maple Avenue",
    city: "Ferguson",
    zip: "63135",
    price: 65000,
    beds: 4,
    baths: 2,
    sqft: 1450,
    estimatedRent: 1200,
    estimatedARV: 105000,
    status: "active",
    dateAdded: "2024-01-12",
    image: null,
  },
  {
    id: "3",
    type: "wholesaler",
    address: "9101 Pine Drive",
    city: "Jennings",
    zip: "63136",
    price: 55000,
    beds: 3,
    baths: 1,
    sqft: 1100,
    estimatedRent: 950,
    estimatedARV: 95000,
    status: "active",
    dateAdded: "2024-01-10",
    image: null,
  },
  {
    id: "4",
    type: "jens-pick",
    address: "2222 Elm Court",
    city: "Berkeley",
    zip: "63134",
    price: 82000,
    beds: 4,
    baths: 1.5,
    sqft: 1380,
    estimatedRent: 1250,
    estimatedARV: 125000,
    status: "under-contract",
    dateAdded: "2024-01-08",
    image: null,
  },
  {
    id: "5",
    type: "mls",
    address: "3333 Cedar Lane",
    city: "Normandy",
    zip: "63121",
    price: 48000,
    beds: 2,
    baths: 1,
    sqft: 900,
    estimatedRent: 850,
    estimatedARV: 78000,
    status: "active",
    dateAdded: "2024-01-05",
    image: null,
  },
  {
    id: "6",
    type: "wholesaler",
    address: "4444 Birch Road",
    city: "Hazelwood",
    zip: "63042",
    price: 72000,
    beds: 3,
    baths: 2,
    sqft: 1320,
    estimatedRent: 1150,
    estimatedARV: 115000,
    status: "active",
    dateAdded: "2024-01-03",
    image: null,
  },
];

const dealTypeLabels = {
  "jens-pick": { label: "Jen's Pick", icon: Star, color: "bg-primary text-primary-foreground" },
  mls: { label: "MLS", icon: Building2, color: "bg-secondary text-secondary-foreground" },
  wholesaler: { label: "Wholesaler", icon: FileText, color: "bg-muted text-muted-foreground" },
};

const statusLabels = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  "under-contract": { label: "Under Contract", color: "bg-yellow-100 text-yellow-800" },
  sold: { label: "Sold", color: "bg-red-100 text-red-800" },
};

const PortalDeals = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dealTypeFilter, setDealTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDeals = mockDeals.filter((deal) => {
    const matchesSearch =
      deal.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.zip.includes(searchQuery);

    const matchesType = dealTypeFilter === "all" || deal.type === dealTypeFilter;
    
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "under50k" && deal.price < 50000) ||
      (priceFilter === "50k-75k" && deal.price >= 50000 && deal.price < 75000) ||
      (priceFilter === "75k-100k" && deal.price >= 75000 && deal.price < 100000) ||
      (priceFilter === "over100k" && deal.price >= 100000);

    const matchesStatus = statusFilter === "all" || deal.status === statusFilter;

    return matchesSearch && matchesType && matchesPrice && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Available Deals</h1>
        <p className="text-muted-foreground text-sm">
          Browse curated investment opportunities. Click any deal for details and actions.
        </p>
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

          <Select value={dealTypeFilter} onValueChange={setDealTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Deal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="jens-pick">Jen's Picks</SelectItem>
              <SelectItem value="mls">MLS Deals</SelectItem>
              <SelectItem value="wholesaler">Wholesaler Deals</SelectItem>
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="under-contract">Under Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredDeals.length} of {mockDeals.length} deals
      </p>

      {/* Deals Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDeals.map((deal) => {
          const typeInfo = dealTypeLabels[deal.type as keyof typeof dealTypeLabels];
          const statusInfo = statusLabels[deal.status as keyof typeof statusLabels];
          const TypeIcon = typeInfo.icon;

          return (
            <Link
              key={deal.id}
              to={`/portal/deals/${deal.id}`}
              className="group"
            >
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className={typeInfo.color}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeInfo.label}
                    </Badge>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
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
                    {deal.estimatedRent && deal.price && (
                      <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">Rent/Price</p>
                        <p className="text-sm font-semibold text-foreground">
                          {((deal.estimatedRent / deal.price) * 100).toFixed(2)}%
                        </p>
                      </div>
                    )}
                    {deal.estimatedARV && deal.price && (
                      <div className="bg-accent/50 rounded px-2 py-1.5 text-center">
                        <p className="text-xs text-muted-foreground">ARV %</p>
                        <p className="text-sm font-semibold text-foreground">
                          {((deal.price / deal.estimatedARV) * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Asking</p>
                      <p className="font-serif text-lg font-medium text-foreground">
                        ${deal.price.toLocaleString()}
                      </p>
                    </div>
                    {deal.estimatedRent && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Est. Rent</p>
                        <p className="text-sm font-medium text-foreground">
                          ${deal.estimatedRent.toLocaleString()}/mo
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
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No deals match your filters.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setDealTypeFilter("all");
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
          <strong className="text-foreground">Disclaimer:</strong> Deal availability may change 
          without notice. Financial estimates are for informational purposes only. Investors 
          must verify all information independently.
        </p>
      </div>
    </div>
  );
};

export default PortalDeals;
