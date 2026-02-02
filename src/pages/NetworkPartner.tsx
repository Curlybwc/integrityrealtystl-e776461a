import { useState } from "react";
import { Wrench, CheckCircle, Phone, Mail, Globe, Briefcase } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const serviceCategories = [
  "General Contractor",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Foundation/Structural",
  "Flooring",
  "Painting",
  "Landscaping",
  "Property Management",
  "Home Inspector",
  "Appraiser",
  "Title Company",
  "Attorney",
  "Insurance Agent",
  "Lender/Mortgage",
  "Other",
];

const NetworkPartner = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    website: "",
    category: "",
    serviceArea: "",
    experience: "",
    description: "",
    references: false,
    insurance: false,
    licensed: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - will connect to backend later
    console.log("Network Partner Application:", formData);
    setIsSubmitted(true);
    toast({
      title: "Application Submitted",
      description: "We'll review your application and be in touch soon.",
    });
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <Layout>
        <div className="py-20 px-6">
          <div className="container mx-auto max-w-2xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-3xl text-foreground mb-4">
              Application Received
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your interest in becoming a Network Partner. We'll review 
              your application and contact you within 3-5 business days.
            </p>
            <Button asChild>
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
            Apply to be a Network Partner
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join our trusted network of contractors and service providers. Connect with 
            active real estate investors in the St. Louis area.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-6 border-b border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-serif text-xl text-foreground mb-6 text-center">
            Why Join Our Network?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Consistent Work</h3>
              <p className="text-sm text-muted-foreground">
                Connect with investors who regularly need reliable service providers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Direct Referrals</h3>
              <p className="text-sm text-muted-foreground">
                Your contact info is shared directly with qualified investors.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No Fees</h3>
              <p className="text-sm text-muted-foreground">
                Listing in our network is free. We don't take a cut of your work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Company Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="ABC Contracting"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(314) 555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@abccontracting.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://www.abccontracting.com"
                />
              </div>
            </div>

            {/* Service Info */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Service Details</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Service Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateField("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years in Business *</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => updateField("experience", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-10">5-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceArea">Service Area *</Label>
                <Input
                  id="serviceArea"
                  required
                  value={formData.serviceArea}
                  onChange={(e) => updateField("serviceArea", e.target.value)}
                  placeholder="North County, St. Louis City, St. Charles..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Brief Description of Services *
                </Label>
                <Textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe your services, specialties, and what sets you apart..."
                />
              </div>
            </div>

            {/* Qualifications */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Qualifications</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="licensed"
                    checked={formData.licensed}
                    onCheckedChange={(checked) => updateField("licensed", !!checked)}
                  />
                  <Label htmlFor="licensed" className="text-sm font-normal">
                    Licensed in Missouri (if applicable to your trade)
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="insurance"
                    checked={formData.insurance}
                    onCheckedChange={(checked) => updateField("insurance", !!checked)}
                  />
                  <Label htmlFor="insurance" className="text-sm font-normal">
                    Carry liability insurance
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="references"
                    checked={formData.references}
                    onCheckedChange={(checked) => updateField("references", !!checked)}
                  />
                  <Label htmlFor="references" className="text-sm font-normal">
                    Willing to provide references upon request
                  </Label>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">
                By submitting this application, you understand that Integrity Realty STL 
                reserves the right to approve or deny applications at our discretion. 
                Listing in our network does not constitute an endorsement or guarantee 
                of services. Investors are responsible for vetting and selecting their 
                own service providers.
              </p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Submit Application
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default NetworkPartner;
