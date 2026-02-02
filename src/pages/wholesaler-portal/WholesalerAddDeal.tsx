import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const WholesalerAddDeal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Deal Submitted",
      description: "Your deal has been submitted for review. It will be visible to investors once approved.",
    });

    setIsSubmitting(false);
    navigate("/wholesaler-portal/deals");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            Add New Deal
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit a property for investors to view
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Address */}
        <Card>
          <CardHeader>
            <CardTitle>Property Address</CardTitle>
            <CardDescription>Enter the property location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input id="address" placeholder="123 Main St" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" placeholder="St. Louis" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" defaultValue="MO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input id="zip" placeholder="63101" required />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Describe the property characteristics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input id="bedrooms" type="number" min="0" placeholder="3" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input id="bathrooms" type="number" min="0" step="0.5" placeholder="2" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet *</Label>
                <Input id="sqft" type="number" min="0" placeholder="1500" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input id="yearBuilt" type="number" min="1800" max="2025" placeholder="1950" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single Family</SelectItem>
                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="triplex">Triplex</SelectItem>
                    <SelectItem value="fourplex">Fourplex</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Property Condition *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teardown">Teardown</SelectItem>
                    <SelectItem value="major-rehab">Major Rehab Needed</SelectItem>
                    <SelectItem value="moderate-rehab">Moderate Rehab</SelectItem>
                    <SelectItem value="light-rehab">Light Rehab</SelectItem>
                    <SelectItem value="move-in-ready">Move-In Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Property Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the property, its potential, and any notable features..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>Enter the deal numbers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="askingPrice">Asking Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="askingPrice" type="number" min="0" className="pl-7" placeholder="50000" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="arv">After Repair Value (ARV) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="arv" type="number" min="0" className="pl-7" placeholder="150000" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairCost">Estimated Repair Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="repairCost" type="number" min="0" className="pl-7" placeholder="60000" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractExpiry">Contract Expiry Date</Label>
              <Input id="contractExpiry" type="date" />
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Upload property photos (up to 10)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Drag and drop photos here, or click to browse
              </p>
              <Button type="button" variant="outline">
                Choose Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG up to 5MB each
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Deal for Review"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WholesalerAddDeal;
