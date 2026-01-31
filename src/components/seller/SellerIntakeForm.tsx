import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const SellerIntakeForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyAddress: "",
    city: "",
    state: "MO",
    zip: "",
    propertyType: "",
    occupancyStatus: "",
    desiredTimeframe: "",
    desiredPrice: "",
    reasonForSelling: "",
    additionalNotes: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - replace with actual GoHighLevel integration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Thank You!",
      description:
        "Thank you for reaching out. Someone from our team will contact you to schedule a consultation.",
    });

    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      propertyAddress: "",
      city: "",
      state: "MO",
      zip: "",
      propertyType: "",
      occupancyStatus: "",
      desiredTimeframe: "",
      desiredPrice: "",
      reasonForSelling: "",
      additionalNotes: "",
    });
  };

  return (
    <section className="py-16 px-6 bg-secondary/30" id="seller-inquiry">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Request a Listing Consultation
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Tell us about your property and goals. We'll reach out to schedule a 
          consultation and discuss how we can help you sell with confidence.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-8 shadow-card space-y-6"
        >
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-foreground">Your Information</h3>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Property Details</h3>

            <div>
              <Label htmlFor="propertyAddress">Property Address *</Label>
              <Input
                id="propertyAddress"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MO">MO</SelectItem>
                    <SelectItem value="IL">IL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zip">ZIP *</Label>
                <Input
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleSelectChange("propertyType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single-Family</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="occupancyStatus">Occupancy Status *</Label>
                <Select
                  value={formData.occupancyStatus}
                  onValueChange={(value) => handleSelectChange("occupancyStatus", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner-occupied">Owner-Occupied</SelectItem>
                    <SelectItem value="tenant-occupied">Tenant-Occupied</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline & Goals */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Timeline & Goals</h3>

            <div>
              <Label htmlFor="desiredTimeframe">Desired Timeframe to Sell *</Label>
              <Select
                value={formData.desiredTimeframe}
                onValueChange={(value) => handleSelectChange("desiredTimeframe", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="When are you looking to sell?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As Soon As Possible</SelectItem>
                  <SelectItem value="1-3months">1-3 Months</SelectItem>
                  <SelectItem value="3-6months">3-6 Months</SelectItem>
                  <SelectItem value="6plus">6+ Months</SelectItem>
                  <SelectItem value="exploring">Just Exploring Options</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="desiredPrice">Desired Selling Price (Optional)</Label>
              <Input
                id="desiredPrice"
                name="desiredPrice"
                value={formData.desiredPrice}
                onChange={handleInputChange}
                placeholder="Helps us understand your expectations"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This helps us understand your expectations. Final pricing is determined through 
                market analysis and consultation.
              </p>
            </div>

            <div>
              <Label htmlFor="reasonForSelling">Reason for Selling (Optional)</Label>
              <Textarea
                id="reasonForSelling"
                name="reasonForSelling"
                value={formData.reasonForSelling}
                onChange={handleInputChange}
                placeholder="Relocating, downsizing, upgrading, etc."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Anything else you'd like us to know?"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Form Note */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Note:</strong> Any price entered above is not a 
              valuation or recommendation. Final listing price will be discussed after reviewing 
              comparable sales, market conditions, and your goals.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Request Consultation
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default SellerIntakeForm;
