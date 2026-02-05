import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Eye, EyeOff, CheckCircle, Archive } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";

const AdminDashboard = () => {
  const { getDealsByTab } = useDeals();

  const unreviewedCount = getDealsByTab("unreviewed").length;
  const reviewedCount = getDealsByTab("reviewed").length;
  const removedCount = getDealsByTab("removed").length;
  const archivedCount = getDealsByTab("archived").length;

  const stats = [
    {
      title: "Passing Unreviewed",
      value: unreviewedCount,
      description: "Deals needing admin review",
      icon: Eye,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Passing Reviewed",
      value: reviewedCount,
      description: "Visible to buyers",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Removed",
      value: removedCount,
      description: "Failed after admin override",
      icon: EyeOff,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Archived Sold",
      value: archivedCount,
      description: "Completed transactions",
      icon: Archive,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Deal screening overview and quick actions
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.title}</CardDescription>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Common admin tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/admin/deal-pot">
              <Building2 className="w-4 h-4 mr-2" />
              Open Deal Pot
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/deal-pot?tab=unreviewed">
              Review Unscreened ({unreviewedCount})
            </Link>
          </Button>
          {removedCount > 0 && (
            <Button variant="secondary" asChild>
              <Link to="/admin/deal-pot?tab=removed">
                View Removed ({removedCount})
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Screening Logic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">Turnkey Strategy</h4>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Rent/Price ratio ≥ 1.35%</li>
              <li>Price between 80-100% of ARV</li>
              <li>Status must be Active or Pending</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">BRRRR Strategy</h4>
            <ul className="list-disc list-inside text-muted-foreground ml-2">
              <li>Rent/Price ratio ≥ 1.30%</li>
              <li>All-In (Price + Rehab) ≤ 75% of ARV</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Buyer Visibility</h4>
            <p className="text-muted-foreground ml-2">
              Deals are visible to buyers only if they pass at least one strategy,
              are not sold, and have not been removed by admin override.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
