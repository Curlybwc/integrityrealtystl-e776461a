import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, DollarSign, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CONSULT_FEE = 50;
const PAYMENT_URL = "https://example.com/pay/integrity-consult"; // Placeholder

const PortalPaidConsult = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredTime: "",
    callMethod: "",
    phoneNumber: "",
    topics: "",
    questions: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentClick = () => {
    window.open(PAYMENT_URL, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentConfirmed) {
      toast({
        title: "Payment Required",
        description: "Please complete payment and confirm before scheduling.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Consultation Scheduled",
      description:
        "We've received your request. You'll receive a calendar invite shortly.",
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
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">
            Request Paid Consultation
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Book a one-on-one call to walk through this specific deal in detail. 
          We'll review the numbers, photos, repair estimates, neighborhood data, and more.
        </p>
      </div>

      {/* What's Included */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h3 className="font-serif text-lg text-foreground mb-4">What's Included</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            "Detailed deal analysis",
            "Repair estimate review",
            "Photo walkthrough",
            "Crime & neighborhood data",
            "Rent comp verification",
            "ARV validation",
            "Investment strategy discussion",
            "Q&A on this specific property",
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">30-minute call</span>
        </div>
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

        {/* Payment Section */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-foreground">Consultation Fee</h3>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground text-lg">
                  ${CONSULT_FEE} Consultation Fee
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment is required before scheduling. This fee covers preparation time 
              and the consultation call.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={handlePaymentClick}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Pay ${CONSULT_FEE} Consultation Fee
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
        </div>

        {/* Scheduling */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-serif text-lg text-foreground">Schedule Your Call</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate">Preferred Date *</Label>
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="preferredTime">Preferred Time *</Label>
              <Select
                value={formData.preferredTime}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, preferredTime: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9am">9:00 AM</SelectItem>
                  <SelectItem value="10am">10:00 AM</SelectItem>
                  <SelectItem value="11am">11:00 AM</SelectItem>
                  <SelectItem value="12pm">12:00 PM</SelectItem>
                  <SelectItem value="1pm">1:00 PM</SelectItem>
                  <SelectItem value="2pm">2:00 PM</SelectItem>
                  <SelectItem value="3pm">3:00 PM</SelectItem>
                  <SelectItem value="4pm">4:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="callMethod">Preferred Call Method *</Label>
            <Select
              value={formData.callMethod}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, callMethod: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="How would you like to connect?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="zoom">Zoom Video Call</SelectItem>
                <SelectItem value="google-meet">Google Meet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.callMethod === "phone" && (
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Your phone number"
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Topics */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="font-serif text-lg text-foreground">Discussion Topics</h3>

          <div>
            <Label htmlFor="topics">What would you like to focus on?</Label>
            <Textarea
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleInputChange}
              placeholder="e.g., Repair cost validation, rental market analysis, exit strategy options..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="questions">Specific Questions</Label>
            <Textarea
              id="questions"
              name="questions"
              value={formData.questions}
              onChange={handleInputChange}
              placeholder="Any specific questions you want answered during the call?"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Please Note:</strong> This consultation 
            is for educational and informational purposes only. All investment decisions 
            are the sole responsibility of the investor. Integrity Realty STL does not 
            guarantee investment outcomes or the accuracy of third-party information.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !paymentConfirmed}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            "Scheduling..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Schedule Consultation
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PortalPaidConsult;
