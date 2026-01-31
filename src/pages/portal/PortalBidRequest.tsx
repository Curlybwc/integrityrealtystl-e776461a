import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Wrench, DollarSign, Clock, ExternalLink, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Mock contractor data
const mockContractors = [
  {
    id: "1",
    name: "Mike's Renovation Co.",
    specialty: "General Contractor",
    bidFeeRequired: true,
    bidFeeAmount: 150,
    estimatedTurnaround: "3-5 business days",
    paymentUrl: "https://example.com/pay/mikes-renovation",
  },
  {
    id: "2",
    name: "STL Property Inspections",
    specialty: "Property Inspector",
    bidFeeRequired: true,
    bidFeeAmount: 75,
    estimatedTurnaround: "2-3 business days",
    paymentUrl: "https://example.com/pay/stl-inspections",
  },
  {
    id: "3",
    name: "Budget Rehab Solutions",
    specialty: "Investor-Focused Contractor",
    bidFeeRequired: false,
    bidFeeAmount: 0,
    estimatedTurnaround: "5-7 business days",
    paymentUrl: null,
  },
];

const PortalBidRequest = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<typeof mockContractors[0] | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [useOwnContractor, setUseOwnContractor] = useState(false);

  const [formData, setFormData] = useState({
    contractorId: "",
    preferredDate1: "",
    preferredDate2: "",
    preferredTime: "",
    customContractorName: "",
    customContractorPhone: "",
    customContractorEmail: "",
    scopeOfWork: "",
    specialInstructions: "",
    shareAuthorization: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContractorSelect = (contractorId: string) => {
    setFormData((prev) => ({ ...prev, contractorId }));
    const contractor = mockContractors.find((c) => c.id === contractorId);
    setSelectedContractor(contractor || null);
    setPaymentConfirmed(false);
  };

  const handlePaymentClick = () => {
    if (selectedContractor?.paymentUrl) {
      window.open(selectedContractor.paymentUrl, "_blank");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedContractor?.bidFeeRequired && !paymentConfirmed) {
      toast({
        title: "Payment Required",
        description: "Please complete payment and confirm before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Bid Request Submitted",
      description:
        "We'll coordinate with the seller/wholesaler and notify you when scheduling is confirmed.",
    });

    setIsSubmitting(false);
    navigate(`/portal/my-bids`);
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">
            Request Contractor Bid
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Request a contractor walkthrough and repair bid for this property.
          Access is subject to seller or wholesaler approval.
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

        {/* Contractor Selection */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-foreground">Select a Contractor</h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useOwnContractor"
              checked={useOwnContractor}
              onCheckedChange={(checked) => {
                setUseOwnContractor(checked as boolean);
                if (checked) {
                  setSelectedContractor(null);
                  setFormData((prev) => ({ ...prev, contractorId: "" }));
                }
              }}
            />
            <Label htmlFor="useOwnContractor" className="text-sm">
              I want to bring my own contractor
            </Label>
          </div>

          {!useOwnContractor && (
            <div className="space-y-4">
              <Select
                value={formData.contractorId}
                onValueChange={handleContractorSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vetted contractor" />
                </SelectTrigger>
                <SelectContent>
                  {mockContractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name} - {contractor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Contractor Details Card */}
              {selectedContractor && (
                <div className="bg-accent/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{selectedContractor.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedContractor.specialty}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {selectedContractor.estimatedTurnaround}
                    </span>
                  </div>

                  {selectedContractor.bidFeeRequired ? (
                    <div className="bg-background border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">
                          Bid Fee: ${selectedContractor.bidFeeAmount}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This contractor requires a bid fee paid directly to them before scheduling.
                        Integrity Realty STL does not collect or process this payment.
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePaymentClick}
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Pay ${selectedContractor.bidFeeAmount} Bid Fee
                      </Button>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id="paymentConfirmed"
                          checked={paymentConfirmed}
                          onCheckedChange={(checked) => setPaymentConfirmed(checked as boolean)}
                        />
                        <Label htmlFor="paymentConfirmed" className="text-sm">
                          I have completed the payment
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✓ No bid fee required for this contractor
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom Contractor Fields */}
          {useOwnContractor && (
            <div className="space-y-4 bg-accent/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                Provide your contractor's information. We'll coordinate access on your behalf.
              </p>
              <div>
                <Label htmlFor="customContractorName">Contractor Name *</Label>
                <Input
                  id="customContractorName"
                  name="customContractorName"
                  value={formData.customContractorName}
                  onChange={handleInputChange}
                  required={useOwnContractor}
                  placeholder="Name of contractor"
                  className="mt-1"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customContractorPhone">Phone *</Label>
                  <Input
                    id="customContractorPhone"
                    name="customContractorPhone"
                    type="tel"
                    value={formData.customContractorPhone}
                    onChange={handleInputChange}
                    required={useOwnContractor}
                    placeholder="Phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customContractorEmail">Email</Label>
                  <Input
                    id="customContractorEmail"
                    name="customContractorEmail"
                    type="email"
                    value={formData.customContractorEmail}
                    onChange={handleInputChange}
                    placeholder="Email address"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-serif text-lg text-foreground">Preferred Dates</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate1">First Choice Date *</Label>
              <Input
                id="preferredDate1"
                name="preferredDate1"
                type="date"
                value={formData.preferredDate1}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="preferredDate2">Second Choice Date</Label>
              <Input
                id="preferredDate2"
                name="preferredDate2"
                type="date"
                value={formData.preferredDate2}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferredTime">Preferred Time of Day</Label>
            <Input
              id="preferredTime"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleInputChange}
              placeholder="e.g., Morning, Afternoon, After 3pm"
              className="mt-1"
            />
          </div>
        </div>

        {/* Scope of Work */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <Label htmlFor="scopeOfWork">Scope of Work / Areas to Bid</Label>
            <Textarea
              id="scopeOfWork"
              name="scopeOfWork"
              value={formData.scopeOfWork}
              onChange={handleInputChange}
              placeholder="Describe what you want the contractor to evaluate and bid (e.g., full rehab, kitchen/bath only, HVAC, roof, etc.)"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="Any special access needs, areas of concern, etc."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        {/* Bid Sharing Authorization */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-serif text-lg text-foreground">Bid Sharing (Optional)</h3>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="shareAuthorization"
              checked={formData.shareAuthorization}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, shareAuthorization: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="shareAuthorization" className="text-sm font-normal">
                If I decide I am not interested in this property, I authorize Integrity Realty STL 
                to share this bid (anonymously) with other investors.
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Your identity will not be disclosed. Shared bids are labeled "Informational Only." 
                This helps other investors and reduces wasted effort.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Please Note:</strong> Contractor bids are 
            independent third-party estimates. Integrity Realty STL does not verify scope, 
            pricing, or contractor performance. Investors are responsible for their own due 
            diligence. Walkthrough access is subject to seller or wholesaler approval.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || (selectedContractor?.bidFeeRequired && !paymentConfirmed && !useOwnContractor)}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Bid Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PortalBidRequest;
