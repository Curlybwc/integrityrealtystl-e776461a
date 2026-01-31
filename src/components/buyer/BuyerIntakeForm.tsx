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

const BuyerIntakeForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    preferredAreas: "",
    priceRange: "",
    timeframe: "",
    preapprovalStatus: "",
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
        "Thanks for reaching out. Someone from our team will contact you shortly.",
    });

    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      preferredAreas: "",
      priceRange: "",
      timeframe: "",
      preapprovalStatus: "",
      additionalNotes: "",
    });
  };

  return (
    <section className="py-16 px-6 bg-secondary/30" id="buyer-inquiry">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Get Help Finding Your Next Home
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Tell us a bit about what you're looking for and we'll be in touch 
          to discuss how we can help.
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

          {/* Home Search Preferences */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">What Are You Looking For?</h3>

            <div>
              <Label htmlFor="preferredAreas">Preferred Areas or ZIP Codes *</Label>
              <Input
                id="preferredAreas"
                name="preferredAreas"
                value={formData.preferredAreas}
                onChange={handleInputChange}
                placeholder="e.g., Clayton, Kirkwood, 63105"
                required
                className="mt-1"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceRange">Price Range *</Label>
                <Select
                  value={formData.priceRange}
                  onValueChange={(value) => handleSelectChange("priceRange", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under150k">Under $150,000</SelectItem>
                    <SelectItem value="150k-250k">$150,000 - $250,000</SelectItem>
                    <SelectItem value="250k-350k">$250,000 - $350,000</SelectItem>
                    <SelectItem value="350k-500k">$350,000 - $500,000</SelectItem>
                    <SelectItem value="over500k">Over $500,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeframe">When Do You Need to Move? *</Label>
                <Select
                  value={formData.timeframe}
                  onValueChange={(value) => handleSelectChange("timeframe", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">As Soon As Possible</SelectItem>
                    <SelectItem value="1-3months">1-3 Months</SelectItem>
                    <SelectItem value="3-6months">3-6 Months</SelectItem>
                    <SelectItem value="6plus">6+ Months</SelectItem>
                    <SelectItem value="justlooking">Just Starting to Look</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="preapprovalStatus">Pre-Approval Status *</Label>
              <Select
                value={formData.preapprovalStatus}
                onValueChange={(value) => handleSelectChange("preapprovalStatus", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Are you pre-approved for a mortgage?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I'm Pre-Approved</SelectItem>
                  <SelectItem value="inprogress">In Progress</SelectItem>
                  <SelectItem value="notyet">Not Yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="pt-4 border-t border-border">
            <Label htmlFor="additionalNotes">Anything Else We Should Know? (Optional)</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Number of bedrooms, must-haves, special circumstances, etc."
              className="mt-1"
              rows={3}
            />
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
                Send My Information
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default BuyerIntakeForm;
