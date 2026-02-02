import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const PartnerProfile = () => {
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Update your business information that appears in the Local Network directory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            This information is visible to investors in the portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" placeholder="Your Business Name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty / Services</Label>
              <Input id="specialty" placeholder="e.g., Full Rehabs, Kitchens, Bathrooms" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="(314) 555-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contact@yourbusiness.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="www.yourbusiness.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">About Your Business</Label>
              <Textarea 
                id="description" 
                rows={4}
                placeholder="Describe your business, experience, and what sets you apart..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceAreas">Service Areas</Label>
              <Input id="serviceAreas" placeholder="e.g., North County, St. Louis City, South County" />
              <p className="text-xs text-muted-foreground">Separate multiple areas with commas</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input id="yearsInBusiness" type="number" placeholder="10" className="w-32" />
            </div>

            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Full profile editing with photo uploads requires backend integration. 
            Contact us to update additional information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerProfile;
