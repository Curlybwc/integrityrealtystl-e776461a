import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Award, 
  Clock, 
  Star, 
  Building2,
  Wrench,
  Users,
  Shield,
  Scale,
  FileCheck,
  Search,
  Home,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPartnerById, PartnerType } from "@/data/networkPartners";

const typeIcons: Record<PartnerType, React.ElementType> = {
  contractor: Wrench,
  "property-manager": Users,
  lender: Building2,
  insurance: Shield,
  attorney: Scale,
  "title-company": FileCheck,
  inspector: Search,
  appraiser: Home,
  bank: Landmark,
};

const typeLabels: Record<PartnerType, string> = {
  contractor: "Contractor",
  "property-manager": "Property Manager",
  lender: "DSCR Lender",
  insurance: "Insurance Provider",
  attorney: "Attorney",
  "title-company": "Title Company",
  inspector: "Inspector",
  appraiser: "Appraiser",
  bank: "Local Bank",
};

const PortalPartnerProfile = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const partner = partnerId ? getPartnerById(partnerId) : null;

  if (!partner) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to="/portal/local-network">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Local Network
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Partner not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TypeIcon = typeIcons[partner.type];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/portal/local-network">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Local Network
        </Button>
      </Link>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TypeIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-2xl">{partner.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{typeLabels[partner.type]}</Badge>
                  {partner.yearsInBusiness && (
                    <span className="text-sm text-muted-foreground">
                      {partner.yearsInBusiness}+ years in business
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{partner.specialty}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact Info */}
          <div className="flex flex-wrap gap-4">
            {partner.phone && (
              <a 
                href={`tel:${partner.phone.replace(/\D/g, '')}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                {partner.phone}
              </a>
            )}
            {partner.email && (
              <a 
                href={`mailto:${partner.email}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                {partner.email}
              </a>
            )}
            {partner.website && (
              <a 
                href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4" />
                {partner.website}
              </a>
            )}
            {partner.contact && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                Contact: {partner.contact}
              </span>
            )}
          </div>

          {/* Description */}
          {partner.description && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-muted-foreground">{partner.description}</p>
              </div>
            </>
          )}

          {/* Service Areas */}
          {partner.serviceAreas && partner.serviceAreas.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {partner.serviceAreas.map((area, index) => (
                    <Badge key={index} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Certifications */}
          {partner.certifications && partner.certifications.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Certifications & Licenses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {partner.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary">{cert}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bid Info for Contractors */}
          {partner.type === "contractor" && partner.bidFeeRequired !== undefined && (
            <>
              <Separator />
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Bid Request Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Bid Fee:</span>
                    <span className="ml-2 font-medium">
                      {partner.bidFeeRequired ? `$${partner.bidFeeAmount}` : "Free"}
                    </span>
                  </div>
                  {partner.estimatedTurnaround && (
                    <div>
                      <span className="text-muted-foreground">Turnaround:</span>
                      <span className="ml-2 font-medium">{partner.estimatedTurnaround}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Testimonials */}
      {partner.testimonials && partner.testimonials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Client Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.testimonials.map((testimonial, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                <p className="text-sm mt-2 font-medium">
                  — {testimonial.author}
                  {testimonial.date && <span className="text-muted-foreground font-normal"> ({testimonial.date})</span>}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Partner profile editing coming soon. Partners will be able to update their own information, 
            add testimonials, and upload photos of their work.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalPartnerProfile;
