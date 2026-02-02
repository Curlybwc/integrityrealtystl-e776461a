import { Link } from "react-router-dom";
import { Building2, PlusCircle, Eye, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data - will be replaced with real data when backend is enabled
const mockStats = {
  activeDeals: 4,
  drafts: 1,
  totalViews: 127,
  totalOffers: 8,
};

const mockRecentDeals = [
  {
    id: "1",
    address: "4521 Maffitt Ave",
    city: "St. Louis",
    askingPrice: 45000,
    arv: 120000,
    status: "active",
    views: 34,
    offers: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    address: "3847 N Grand Blvd",
    city: "St. Louis",
    askingPrice: 65000,
    arv: 175000,
    status: "active",
    views: 56,
    offers: 4,
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    address: "2156 Benton St",
    city: "St. Louis",
    askingPrice: 38000,
    arv: 95000,
    status: "draft",
    views: 0,
    offers: 0,
    createdAt: "2024-01-18",
  },
];

const WholesalerDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Welcome back, Mike
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your deal activity
          </p>
        </div>
        <Button asChild>
          <Link to="/wholesaler-portal/add-deal">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add New Deal
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{mockStats.activeDeals}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{mockStats.drafts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{mockStats.totalViews}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold">{mockStats.totalOffers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Deals</CardTitle>
              <CardDescription>Your most recently posted properties</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/wholesaler-portal/deals">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{deal.address}</h3>
                    <Badge
                      variant={deal.status === "active" ? "default" : "secondary"}
                    >
                      {deal.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{deal.city}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span>
                      <strong>${deal.askingPrice.toLocaleString()}</strong> asking
                    </span>
                    <span className="text-muted-foreground">
                      ARV: ${deal.arv.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {deal.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {deal.offers} offers
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/wholesaler-portal/deals/${deal.id}`}>Manage</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WholesalerDashboard;
