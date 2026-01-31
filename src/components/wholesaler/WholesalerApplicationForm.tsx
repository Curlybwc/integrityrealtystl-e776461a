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

const WholesalerApplicationForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    markets: "",
    dealVolume: "",
    howSourced: "",
    references: "",
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
      title: "Application Received",
      description:
        "Thank you for applying. We'll review your application and contact you regarding next steps.",
    });

    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      markets: "",
      dealVolume: "",
      howSourced: "",
      references: "",
    });
  };

  return (
    <section className="py-16 px-6 bg-secondary/30" id="wholesaler-apply">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Apply to Become an Approved Wholesaler
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Tell us about yourself and your business. Approved wholesalers gain 
          immediate publishing access to our investor network.
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

            <div>
              <Label htmlFor="company">Company Name (Optional)</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Your Business</h3>

            <div>
              <Label htmlFor="markets">Markets / ZIP Codes You Serve *</Label>
              <Input
                id="markets"
                name="markets"
                value={formData.markets}
                onChange={handleInputChange}
                placeholder="e.g., North County STL, 63136, 63137, 63138"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dealVolume">Typical Deal Volume (Optional)</Label>
              <Select
                value={formData.dealVolume}
                onValueChange={(value) => handleSelectChange("dealVolume", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="How often do you close deals?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2-monthly">1-2 deals per month</SelectItem>
                  <SelectItem value="3-5-monthly">3-5 deals per month</SelectItem>
                  <SelectItem value="6plus-monthly">6+ deals per month</SelectItem>
                  <SelectItem value="occasional">Occasional / As available</SelectItem>
                  <SelectItem value="new">Just getting started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="howSourced">How Do You Source Deals? *</Label>
              <Textarea
                id="howSourced"
                name="howSourced"
                value={formData.howSourced}
                onChange={handleInputChange}
                placeholder="Direct mail, driving for dollars, MLS, referrals, etc."
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="references">References or Website (Optional)</Label>
              <Input
                id="references"
                name="references"
                value={formData.references}
                onChange={handleInputChange}
                placeholder="Website URL, LinkedIn, or references"
                className="mt-1"
              />
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Please Note:</strong> Submitting this 
              application does not guarantee approval. Integrity Realty STL reserves 
              the right to approve or decline applications at its discretion. Approved 
              wholesalers will receive login credentials via email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default WholesalerApplicationForm;
