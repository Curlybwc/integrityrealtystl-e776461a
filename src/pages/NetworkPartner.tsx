import { useState } from "react";
import { Wrench, CheckCircle, Phone, Briefcase } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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
  "Cleaning/Junk Removal",
  "Locksmith",
  "Pest Control",
  "Other",
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  streetAddress: z.string().trim().min(1, "Street address is required").max(200, "Address too long"),
  city: z.string().trim().min(1, "City is required").max(100, "City too long"),
  state: z.string().trim().min(1, "State is required").max(50, "State too long"),
  zip: z.string().trim().min(5, "ZIP code is required").max(10, "Invalid ZIP"),
  cellPhone: z.string().trim().min(10, "Cell phone is required").max(20, "Invalid phone"),
  officePhone: z.string().trim().max(20, "Invalid phone").optional(),
  faxPhone: z.string().trim().max(20, "Invalid phone").optional(),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  website: z.string().trim().max(255, "Website too long").optional(),
  serviceCategory: z.string().min(1, "Service category is required"),
  discounts: z.string().trim().max(500, "Description too long").optional(),
});

type FormData = z.infer<typeof formSchema>;

const NetworkPartner = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    streetAddress: "",
    city: "",
    state: "MO",
    zip: "",
    cellPhone: "",
    officePhone: "",
    faxPhone: "",
    email: "",
    website: "",
    serviceCategory: "",
    discounts: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof FormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: "Please fix the errors",
        description: "Some fields need attention.",
        variant: "destructive",
      });
      return;
    }
    
    setErrors({});
    // Mock submission - will connect to backend later
    console.log("Network Partner Application submitted");
    setIsSubmitted(true);
    toast({
      title: "Application Submitted",
      description: "We'll review your application and be in touch soon.",
    });
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Contact Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name (Individual or Company) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John Smith or ABC Contracting"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => updateField("streetAddress", e.target.value)}
                  placeholder="123 Main Street"
                  className={errors.streetAddress ? "border-red-500" : ""}
                />
                {errors.streetAddress && <p className="text-xs text-red-500">{errors.streetAddress}</p>}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="St. Louis"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="MO"
                    className={errors.state ? "border-red-500" : ""}
                  />
                  {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP *</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => updateField("zip", e.target.value)}
                    placeholder="63101"
                    className={errors.zip ? "border-red-500" : ""}
                  />
                  {errors.zip && <p className="text-xs text-red-500">{errors.zip}</p>}
                </div>
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Phone Numbers</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cellPhone">Cell Phone *</Label>
                  <Input
                    id="cellPhone"
                    type="tel"
                    value={formData.cellPhone}
                    onChange={(e) => updateField("cellPhone", e.target.value)}
                    placeholder="(314) 555-0100"
                    className={errors.cellPhone ? "border-red-500" : ""}
                  />
                  {errors.cellPhone && <p className="text-xs text-red-500">{errors.cellPhone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Office Phone</Label>
                  <Input
                    id="officePhone"
                    type="tel"
                    value={formData.officePhone}
                    onChange={(e) => updateField("officePhone", e.target.value)}
                    placeholder="(314) 555-0101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faxPhone">Fax</Label>
                  <Input
                    id="faxPhone"
                    type="tel"
                    value={formData.faxPhone}
                    onChange={(e) => updateField("faxPhone", e.target.value)}
                    placeholder="(314) 555-0102"
                  />
                </div>
              </div>
            </div>

            {/* Email & Website */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Online Presence</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="john@abccontracting.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://www.abccontracting.com"
                  />
                </div>
              </div>
            </div>

            {/* Service Info */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg text-foreground">Service Details</h3>

              <div className="space-y-2">
                <Label htmlFor="serviceCategory">What kind of service do you provide? *</Label>
                <Select
                  value={formData.serviceCategory}
                  onValueChange={(value) => updateField("serviceCategory", value)}
                >
                  <SelectTrigger className={errors.serviceCategory ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select your service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.serviceCategory && <p className="text-xs text-red-500">{errors.serviceCategory}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discounts">
                  Do you offer any coupons or discounts for our investor clients?
                </Label>
                <Textarea
                  id="discounts"
                  rows={3}
                  value={formData.discounts}
                  onChange={(e) => updateField("discounts", e.target.value)}
                  placeholder="e.g., 10% off first service, free estimates, bulk pricing for multiple properties..."
                />
                <p className="text-xs text-muted-foreground">
                  If you offer special pricing for investors, describe it here. This will be shared with our investor network.
                </p>
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
