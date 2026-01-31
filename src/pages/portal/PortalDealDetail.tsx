import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Star,
  FileText,
  Bed,
  Bath,
  Square,
  MapPin,
  DollarSign,
  Calendar,
  Home,
  Users,
  FileSignature,
  Wrench,
  MessageSquare,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock deal data - same as PortalDeals
const mockDeals = [
  {
    id: "1",
    type: "jens-pick",
    address: "1234 Oak Street",
    city: "Florissant",
    state: "MO",
    zip: "63033",
    price: 75000,
    beds: 3,
    baths: 1,
    sqft: 1200,
    estimatedRent: 1100,
    estimatedRepairs: 15000,
    estimatedARV: 110000,
    status: "active",
    dateAdded: "2024-01-15",
    occupancy: "Vacant",
    propertyType: "Single-Family",
    yearBuilt: 1965,
    notes: "Solid brick ranch with good bones. Needs cosmetic updates and mechanical inspection. Roof replaced 2018.",
  },
  {
    id: "2",
    type: "mls",
    address: "5678 Maple Avenue",
    city: "Ferguson",
    state: "MO",
    zip: "63135",
    price: 65000,
    beds: 4,
    baths: 2,
    sqft: 1450,
    estimatedRent: 1200,
    estimatedRepairs: 20000,
    estimatedARV: 105000,
    status: "active",
    dateAdded: "2024-01-12",
    occupancy: "Tenant-Occupied",
    propertyType: "Single-Family",
    yearBuilt: 1958,
    notes: "Section 8 tenant in place paying $1,150/month. Lease expires in 6 months.",
  },
];

const dealTypeLabels = {
  "jens-pick": { label: "Jen's Pick", icon: Star, color: "bg-primary text-primary-foreground" },
  mls: { label: "MLS Deal", icon: Building2, color: "bg-secondary text-secondary-foreground" },
  wholesaler: { label: "Wholesaler Deal", icon: FileText, color: "bg-muted text-muted-foreground" },
};

const PortalDealDetail = () => {
  const { dealId } = useParams();
  const deal = mockDeals.find((d) => d.id === dealId);

  if (!deal) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Deal not found.</p>
        <Link to="/portal/deals">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deals
          </Button>
        </Link>
      </div>
    );
  }

  const typeInfo = dealTypeLabels[deal.type as keyof typeof dealTypeLabels];
  const TypeIcon = typeInfo.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/portal/deals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
        {/* Photo gallery placeholder */}
        <div className="aspect-[21/9] bg-muted relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30" />
          </div>
          <div className="absolute top-4 left-4">
            <Badge className={typeInfo.color}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {typeInfo.label}
            </Badge>
          </div>
        </div>

        {/* Property overview */}
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-serif text-2xl text-foreground mb-1">
                {deal.address}
              </h1>
              <p className="text-muted-foreground flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {deal.city}, {deal.state} {deal.zip}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Asking Price</p>
              <p className="font-serif text-3xl font-medium text-foreground">
                ${deal.price.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {deal.beds} Bedrooms
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {deal.baths} Bathrooms
            </span>
            <span className="flex items-center gap-1">
              <Square className="w-4 h-4" />
              {deal.sqft?.toLocaleString()} sq ft
            </span>
            <span className="flex items-center gap-1">
              <Home className="w-4 h-4" />
              {deal.propertyType}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Built {deal.yearBuilt}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {deal.occupancy}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">
          Financial Snapshot
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          All figures are estimates provided for informational purposes only. 
          Investors must independently verify all information.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Asking Price</p>
            <p className="font-serif text-xl font-medium text-foreground">
              ${deal.price.toLocaleString()}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Repairs</p>
            <p className="font-serif text-xl font-medium text-foreground">
              ${deal.estimatedRepairs?.toLocaleString() || "TBD"}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. ARV</p>
            <p className="font-serif text-xl font-medium text-foreground">
              ${deal.estimatedARV?.toLocaleString() || "TBD"}
            </p>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Est. Rent</p>
            <p className="font-serif text-xl font-medium text-foreground">
              ${deal.estimatedRent?.toLocaleString()}/mo
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {deal.notes && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-card">
          <h2 className="font-serif text-xl text-foreground mb-3">
            Notes & Disclosures
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {deal.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h2 className="font-serif text-xl text-foreground mb-4">
          Take Action
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to={`/portal/deals/${deal.id}/offer`}>
            <Button className="w-full" size="lg">
              <FileSignature className="w-4 h-4 mr-2" />
              Submit Offer
            </Button>
          </Link>
          <Link to={`/portal/deals/${deal.id}/bid`}>
            <Button variant="outline" className="w-full" size="lg">
              <Wrench className="w-4 h-4 mr-2" />
              Request Walkthrough / Bid
            </Button>
          </Link>
          <Link to={`/portal/deals/${deal.id}/consult`}>
            <Button variant="outline" className="w-full" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Request Paid Consult
            </Button>
          </Link>
          <Link to={`/portal/consulting?deal=${deal.id}`}>
            <Button variant="outline" className="w-full" size="lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Disclaimer:</strong> All figures are estimates 
          provided for informational purposes only. Investors must independently verify all 
          information including but not limited to property condition, title status, rental 
          rates, repair costs, and financial projections. Integrity Realty STL does not 
          guarantee the accuracy of any information or the availability of this property.
          {deal.type === "wholesaler" && (
            <> This property information was submitted by a third-party wholesaler. 
            Integrity Realty STL has not independently verified condition, financial 
            estimates, or availability.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default PortalDealDetail;
