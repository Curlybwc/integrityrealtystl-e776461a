import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
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

const PortalSubmitOffer = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    offerPrice: "",
    earnestMoney: "",
    financingType: "",
    inspectionPeriod: "",
    closingTimeline: "",
    contingencies: "",
    additionalTerms: "",
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

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Offer Request Submitted",
      description:
        "We've received your offer request. Our team will review and contact you to discuss next steps.",
    });

    setIsSubmitting(false);
    navigate(`/portal/deals/${dealId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link to={`/portal/deals/${dealId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deal
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Submit Offer</h1>
        <p className="text-muted-foreground text-sm">
          Complete this form to request Integrity Realty STL to prepare an offer on 
          your behalf. This does not constitute an accepted offer.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg p-6 shadow-card space-y-6"
      >
        {/* Property Reference */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Property:</strong> Deal #{dealId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (Property details will be auto-filled when backend is connected)
          </p>
        </div>

        {/* Offer Terms */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-foreground">Offer Terms</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="offerPrice">Offer Price *</Label>
              <Input
                id="offerPrice"
                name="offerPrice"
                value={formData.offerPrice}
                onChange={handleInputChange}
                placeholder="$"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="earnestMoney">Earnest Money Deposit</Label>
              <Input
                id="earnestMoney"
                name="earnestMoney"
                value={formData.earnestMoney}
                onChange={handleInputChange}
                placeholder="$"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="financingType">Financing Type *</Label>
            <Select
              value={formData.financingType}
              onValueChange={(value) => handleSelectChange("financingType", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="How will you fund this purchase?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="conventional">Conventional Financing</SelectItem>
                <SelectItem value="portfolio">Portfolio / DSCR Loan</SelectItem>
                <SelectItem value="hard-money">Hard Money</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectionPeriod">Inspection Period</Label>
              <Select
                value={formData.inspectionPeriod}
                onValueChange={(value) => handleSelectChange("inspectionPeriod", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Inspection</SelectItem>
                  <SelectItem value="5-days">5 Days</SelectItem>
                  <SelectItem value="7-days">7 Days</SelectItem>
                  <SelectItem value="10-days">10 Days</SelectItem>
                  <SelectItem value="14-days">14 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="closingTimeline">Desired Closing Timeline *</Label>
              <Select
                value={formData.closingTimeline}
                onValueChange={(value) => handleSelectChange("closingTimeline", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14-days">14 Days</SelectItem>
                  <SelectItem value="21-days">21 Days</SelectItem>
                  <SelectItem value="30-days">30 Days</SelectItem>
                  <SelectItem value="45-days">45 Days</SelectItem>
                  <SelectItem value="60-days">60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="contingencies">Contingencies</Label>
            <Textarea
              id="contingencies"
              name="contingencies"
              value={formData.contingencies}
              onChange={handleInputChange}
              placeholder="List any contingencies (financing, appraisal, etc.)"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="additionalTerms">Additional Terms or Notes</Label>
            <Textarea
              id="additionalTerms"
              name="additionalTerms"
              value={formData.additionalTerms}
              onChange={handleInputChange}
              placeholder="Any additional terms, conditions, or notes for this offer"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Please Note:</strong> Submitting this form 
            requests that Integrity Realty STL prepare an offer on your behalf. It does not 
            constitute an accepted offer or binding agreement. Actual offer generation occurs 
            only after internal review and your confirmation.
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
              Submit Offer Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PortalSubmitOffer;
