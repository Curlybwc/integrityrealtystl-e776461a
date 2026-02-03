import { useState, useRef } from "react";
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
import { Send, Upload, X, Image, Link as LinkIcon } from "lucide-react";

const SellFastIntakeForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyAddress: "",
    city: "",
    state: "MO",
    zip: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    occupancyStatus: "",
    reasonForSelling: "",
    desiredTimeframe: "",
    desiredPrice: "",
    knownIssues: "",
    additionalNotes: "",
    photoLink: "",
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = uploadedPhotos.length + newFiles.length;

    if (totalPhotos > 25) {
      toast({
        title: "Too many photos",
        description: "You can upload a maximum of 25 photos.",
        variant: "destructive",
      });
      return;
    }

    // Create previews for new files
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setUploadedPhotos((prev) => [...prev, ...newFiles]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - replace with actual GoHighLevel integration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Request Received",
      description:
        "Thank you for reaching out. We'll review your information and contact you to discuss next steps and available options.",
    });

    setIsSubmitting(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      propertyAddress: "",
      city: "",
      state: "MO",
      zip: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
      occupancyStatus: "",
      reasonForSelling: "",
      desiredTimeframe: "",
      desiredPrice: "",
      knownIssues: "",
      additionalNotes: "",
      photoLink: "",
    });
    // Clear photos
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setUploadedPhotos([]);
    setPhotoPreviews([]);
  };

  return (
    <section className="py-16 px-6 bg-secondary/30" id="sellfast-form">
      <div className="container mx-auto max-w-2xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Request a Sell Fast Evaluation
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
          Tell us about your property and situation. We'll review your information 
          and reach out to discuss your options—with no pressure or obligation.
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

          {/* Property Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Property Details</h3>

            <div>
              <Label htmlFor="propertyAddress">Property Address *</Label>
              <Input
                id="propertyAddress"
                name="propertyAddress"
                value={formData.propertyAddress}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => handleSelectChange("state", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MO">MO</SelectItem>
                    <SelectItem value="IL">IL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zip">ZIP *</Label>
                <Input
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => handleSelectChange("propertyType", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single-Family</SelectItem>
                    <SelectItem value="duplex">Duplex</SelectItem>
                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="occupancyStatus">Occupancy Status *</Label>
                <Select
                  value={formData.occupancyStatus}
                  onValueChange={(value) => handleSelectChange("occupancyStatus", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner-occupied">Owner-Occupied</SelectItem>
                    <SelectItem value="tenant-occupied">Tenant-Occupied</SelectItem>
                    <SelectItem value="vacant">Vacant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Select
                  value={formData.bedrooms}
                  onValueChange={(value) => handleSelectChange("bedrooms", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6+">6+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Select
                  value={formData.bathrooms}
                  onValueChange={(value) => handleSelectChange("bathrooms", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="1.5">1.5</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="2.5">2.5</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="3.5">3.5</SelectItem>
                    <SelectItem value="4+">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Property Photos */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Property Photos
              <span className="font-sans text-sm text-muted-foreground">(Optional)</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Photos help us better evaluate your property. You can upload up to 25 photos or provide a link to an online album.
            </p>

            {/* Photo Link */}
            <div>
              <Label htmlFor="photoLink" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Link to Photos
              </Label>
              <Input
                id="photoLink"
                name="photoLink"
                type="url"
                value={formData.photoLink}
                onChange={handleInputChange}
                placeholder="Google Photos, Dropbox, or other photo album link"
                className="mt-1"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Photos (max 25)
              </Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadedPhotos.length >= 25}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadedPhotos.length > 0
                    ? `${uploadedPhotos.length}/25 photos selected`
                    : "Select Photos"}
                </Button>
              </div>

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Property photo ${index + 1}`}
                        className="w-full h-16 object-cover rounded-md border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Situation & Timeline */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">Your Situation</h3>

            <div>
              <Label htmlFor="reasonForSelling">Reason for Selling *</Label>
              <Textarea
                id="reasonForSelling"
                name="reasonForSelling"
                value={formData.reasonForSelling}
                onChange={handleInputChange}
                placeholder="What's prompting you to consider selling? (No judgment—just helps us understand your needs)"
                required
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="desiredTimeframe">Desired Timeframe to Sell *</Label>
              <Select
                value={formData.desiredTimeframe}
                onValueChange={(value) => handleSelectChange("desiredTimeframe", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="When do you need to sell?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">As Soon As Possible</SelectItem>
                  <SelectItem value="30days">Within 30 Days</SelectItem>
                  <SelectItem value="60days">Within 60 Days</SelectItem>
                  <SelectItem value="90days">Within 90 Days</SelectItem>
                  <SelectItem value="flexible">Flexible / No Rush</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-serif text-lg text-foreground">
              Additional Information <span className="font-sans text-sm text-muted-foreground">(Optional)</span>
            </h3>

            <div>
              <Label htmlFor="desiredPrice">Desired Selling Price</Label>
              <Input
                id="desiredPrice"
                name="desiredPrice"
                value={formData.desiredPrice}
                onChange={handleInputChange}
                placeholder="Helps us understand expectations (not a valuation)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is not a valuation or offer—just helps us understand your expectations.
              </p>
            </div>

            <div>
              <Label htmlFor="knownIssues">Known Property Issues</Label>
              <Textarea
                id="knownIssues"
                name="knownIssues"
                value={formData.knownIssues}
                onChange={handleInputChange}
                placeholder="Foundation issues, roof condition, needed repairs, etc."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Anything Else?</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Any other context that would help us understand your situation"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          {/* Form Disclaimer */}
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Please Note:</strong> Submitting this form 
              does not guarantee an offer. Any potential offer would be based on a full review 
              of property condition, market factors, and investment criteria. We'll contact you 
              to discuss all available options, including AS-IS MLS listing.
            </p>
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
                Request Evaluation
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default SellFastIntakeForm;
