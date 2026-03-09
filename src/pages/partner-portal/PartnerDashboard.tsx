import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, Star, Eye, TrendingUp } from "lucide-react";

const PartnerDashboard = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Welcome back, Partner
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and track your visibility in our investor network.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-sm text-muted-foreground">Profile Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-sm text-muted-foreground">Bid Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">—</p>
                <p className="text-sm text-muted-foreground">Testimonials</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Update Your Profile
            </CardTitle>
            <CardDescription>
              Keep your business information, service areas, and contact details up to date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/portal/partner/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Manage Testimonials
            </CardTitle>
            <CardDescription>
              Add client testimonials to build trust with potential investors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/portal/partner/testimonials">Add Testimonial</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Analytics and lead tracking features are coming soon. 
            You'll be able to see how many investors view your profile and request your services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDashboard;
