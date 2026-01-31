import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PortalRequestWalkthrough = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    preferredDate1: "",
    preferredDate2: "",
    preferredTime: "",
    contractorName: "",
    contractorPhone: "",
    contractorEmail: "",
    specialInstructions: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Walkthrough Request Submitted",
      description:
        "We'll coordinate with the seller or wholesaler and contact you to confirm scheduling.",
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">
            Request Contractor Walkthrough
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Request access to the property for a contractor walkthrough and bid. 
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

        {/* Scheduling */}
        <div className="space-y-4">
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

        {/* Contractor Info */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-serif text-lg text-foreground">
            Contractor Information <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            If you have a contractor you'd like to bring, provide their information below. 
            Otherwise, we can coordinate access for you.
          </p>

          <div>
            <Label htmlFor="contractorName">Contractor Name</Label>
            <Input
              id="contractorName"
              name="contractorName"
              value={formData.contractorName}
              onChange={handleInputChange}
              placeholder="Name of contractor"
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractorPhone">Contractor Phone</Label>
              <Input
                id="contractorPhone"
                name="contractorPhone"
                type="tel"
                value={formData.contractorPhone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contractorEmail">Contractor Email</Label>
              <Input
                id="contractorEmail"
                name="contractorEmail"
                type="email"
                value={formData.contractorEmail}
                onChange={handleInputChange}
                placeholder="Email address"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <Label htmlFor="specialInstructions">Special Instructions or Notes</Label>
            <Textarea
              id="specialInstructions"
              name="specialInstructions"
              value={formData.specialInstructions}
              onChange={handleInputChange}
              placeholder="Any special access needs, specific areas to inspect, etc."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Please Note:</strong> Walkthrough access is 
            subject to seller or wholesaler approval and scheduling availability. Integrity 
            Realty STL does not guarantee access and will coordinate on your behalf. Direct 
            contractor access is not provided without prior approval.
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
              Submit Walkthrough Request
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PortalRequestWalkthrough;
