import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
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

const PortalConsulting = () => {
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get("deal");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    topic: "",
    relatedDeal: dealId || "",
    question: "",
    preferredContact: "",
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
      title: "Consulting Request Submitted",
      description:
        "We've received your question. Our team will review and respond as soon as possible.",
    });

    setIsSubmitting(false);
    navigate("/portal/investor");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">
            Consulting Request
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Have a question about a deal, the market, or your investment strategy? 
          Submit it here and we'll respond directly.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-lg p-6 shadow-card space-y-6"
      >
        {/* Topic Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic *</Label>
            <Select
              value={formData.topic}
              onValueChange={(value) => handleSelectChange("topic", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="What is your question about?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="specific-deal">A Specific Deal</SelectItem>
                <SelectItem value="financing">Financing Options</SelectItem>
                <SelectItem value="market">Market Conditions</SelectItem>
                <SelectItem value="strategy">Investment Strategy</SelectItem>
                <SelectItem value="contractors">Contractors / Rehab</SelectItem>
                <SelectItem value="property-management">Property Management</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.topic === "specific-deal" || dealId) && (
            <div>
              <Label htmlFor="relatedDeal">Related Deal ID</Label>
              <Input
                id="relatedDeal"
                name="relatedDeal"
                value={formData.relatedDeal}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3..."
                className="mt-1"
              />
            </div>
          )}
        </div>

        {/* Question */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div>
            <Label htmlFor="question">Your Question *</Label>
            <Textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Please describe your question in detail. The more context you provide, the better we can help."
              required
              className="mt-1"
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="preferredContact">Preferred Contact Method</Label>
            <Select
              value={formData.preferredContact}
              onValueChange={(value) => handleSelectChange("preferredContact", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="How should we respond?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="either">Either is fine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Note */}
        <div className="bg-accent/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Note:</strong> Consulting requests are reviewed 
            during business hours. We aim to respond within 1-2 business days. For urgent matters, 
            please call us directly.
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
              Submit Question
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default PortalConsulting;
