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

const InvestorIntakeForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experienceLevel: "",
    investmentGoals: "",
    targetPriceRange: "",
    fundingMethod: "",
    timeframe: "",
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
      title: "Application Received",
      description:
        "Thank you for your interest. We'll review your application and reach out regarding next steps.",
    });

    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      experienceLevel: "",
      investmentGoals: "",
      targetPriceRange: "",
      fundingMethod: "",
      timeframe: "",
      additionalNotes: "",
    });
  };

  return (
    <section className="py-16 px-6 bg-background" id="apply">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Request Investor Portal Access
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Complete this form to begin the application process. Portal access requires 
          review and execution of an Exclusive Buyer Agency Agreement.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-8 shadow-card space-y-6"
        >
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-foreground">Contact Information</h3>
            
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

          {/* Investment Profile */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Investment Profile</h3>

            <div>
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <Select
                value={formData.experienceLevel}
                onValueChange={(value) => handleSelectChange("experienceLevel", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Investor</SelectItem>
                  <SelectItem value="some">Some Experience (1-3 properties)</SelectItem>
                  <SelectItem value="experienced">Experienced Investor (4+ properties)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="investmentGoals">Investment Goals *</Label>
              <Textarea
                id="investmentGoals"
                name="investmentGoals"
                value={formData.investmentGoals}
                onChange={handleInputChange}
                placeholder="What are you hoping to achieve through real estate investing?"
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetPriceRange">Target Price Range *</Label>
                <Select
                  value={formData.targetPriceRange}
                  onValueChange={(value) => handleSelectChange("targetPriceRange", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select price range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under50k">Under $50,000</SelectItem>
                    <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                    <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                    <SelectItem value="100k-150k">$100,000 - $150,000</SelectItem>
                    <SelectItem value="over150k">Over $150,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="fundingMethod">Funding Method *</Label>
                <Select
                  value={formData.fundingMethod}
                  onValueChange={(value) => handleSelectChange("fundingMethod", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select funding method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="conventional">Conventional Financing</SelectItem>
                    <SelectItem value="portfolio">Portfolio / DSCR Loan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe to Invest *</Label>
              <Select
                value={formData.timeframe}
                onValueChange={(value) => handleSelectChange("timeframe", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="When are you looking to invest?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediately">Ready Now</SelectItem>
                  <SelectItem value="1-3months">1-3 Months</SelectItem>
                  <SelectItem value="3-6months">3-6 Months</SelectItem>
                  <SelectItem value="6plus">6+ Months</SelectItem>
                  <SelectItem value="exploring">Just Exploring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="pt-4 border-t border-border">
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Anything else you'd like us to know?"
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Disclaimer */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Please Note:</strong> Submitting this form does 
              not guarantee access to deals, specific opportunities, or investment results. All 
              investments carry risk and require independent due diligence. Portal access requires 
              review by Integrity Realty STL and execution of an Exclusive Buyer Agency Agreement.
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

export default InvestorIntakeForm;
