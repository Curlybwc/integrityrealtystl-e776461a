import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Eye, DollarSign, MoreVertical, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data - will be replaced with real data when backend is enabled
const mockDeals = [
  {
    id: "1",
    address: "4521 Maffitt Ave",
    city: "St. Louis",
    zip: "63113",
    askingPrice: 45000,
    arv: 120000,
    repairCost: 55000,
    bedrooms: 3,
    bathrooms: 1,
    sqft: 1200,
    status: "active",
    views: 34,
    offers: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    address: "3847 N Grand Blvd",
    city: "St. Louis",
    zip: "63107",
    askingPrice: 65000,
    arv: 175000,
    repairCost: 75000,
    bedrooms: 4,
    bathrooms: 2,
    sqft: 1800,
    status: "active",
    views: 56,
    offers: 4,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    address: "2156 Benton St",
    city: "St. Louis",
    zip: "63106",
    askingPrice: 38000,
    arv: 95000,
    repairCost: 40000,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 950,
    status: "pending",
    views: 12,
    offers: 0,
    createdAt: "2024-01-18",
  },
  {
    id: "4",
    address: "5823 Cabanne Ave",
    city: "St. Louis",
    zip: "63112",
    askingPrice: 72000,
    arv: 185000,
    repairCost: 80000,
    bedrooms: 4,
    bathrooms: 2,
    sqft: 2100,
    status: "sold",
    views: 89,
    offers: 6,
    createdAt: "2024-01-05",
  },
];

const WholesalerDeals = () => {
  const [filter, setFilter] = useState<string>("all");

  const filteredDeals = mockDeals.filter((deal) => {
    if (filter === "all") return true;
    return deal.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      case "sold":
        return <Badge variant="outline" className="text-green-600 border-green-600">Sold</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            My Deals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your posted properties
          </p>
        </div>
        <Button asChild>
          <Link to="/wholesaler-portal/add-deal">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Deal
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deals</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.map((deal) => (
          <Card key={deal.id}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Property Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg font-medium text-foreground">
                      {deal.address}
                    </h3>
                    {getStatusBadge(deal.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {deal.city}, MO {deal.zip}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Asking:</span>
                      <span className="font-medium ml-1">${deal.askingPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ARV:</span>
                      <span className="font-medium ml-1">${deal.arv.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repairs:</span>
                      <span className="font-medium ml-1">${deal.repairCost.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium ml-1">
                        {deal.bedrooms}bd/{deal.bathrooms}ba • {deal.sqft.toLocaleString()} sqft
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {deal.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {deal.offers}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/wholesaler-portal/deals/${deal.id}`} className="flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/wholesaler-portal/deals/${deal.id}/edit`} className="flex items-center">
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Deal
                        </Link>
                      </DropdownMenuItem>
                      {deal.status === "active" && (
                        <DropdownMenuItem>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Sold
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Deal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDeals.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No deals found</p>
              <Button asChild>
                <Link to="/wholesaler-portal/add-deal">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Your First Deal
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WholesalerDeals;
