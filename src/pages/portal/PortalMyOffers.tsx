import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSignature,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Download,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Mock offer data with document workflow
const mockOffers = [
  {
    id: "1",
    dealId: "1",
    propertyAddress: "1234 Oak Street, Florissant, MO 63033",
    offerPrice: 72000,
    submittedDate: "2024-01-18",
    status: "accepted",
    documentStatus: "signed",
    documents: [
      { name: "Purchase Agreement", status: "signed", signedDate: "2024-01-20" },
      { name: "Lead Paint Disclosure", status: "signed", signedDate: "2024-01-20" },
      { name: "Agency Disclosure", status: "signed", signedDate: "2024-01-18" },
    ],
    closingDate: "2024-02-15",
    titleCompany: "Gateway Title",
    mlsNumber: null,
  },
  {
    id: "2",
    dealId: "2",
    propertyAddress: "5678 Maple Avenue, Ferguson, MO 63135",
    offerPrice: 62000,
    submittedDate: "2024-01-20",
    status: "pending-signature",
    documentStatus: "awaiting-signature",
    documents: [
      { name: "Purchase Agreement", status: "pending", signedDate: null },
      { name: "Seller's Disclosure", status: "pending", signedDate: null },
      { name: "Agency Disclosure", status: "signed", signedDate: "2024-01-20" },
    ],
    closingDate: null,
    titleCompany: null,
    mlsNumber: "STL12345",
  },
  {
    id: "3",
    dealId: "3",
    propertyAddress: "9101 Pine Drive, Jennings, MO 63136",
    offerPrice: 52000,
    submittedDate: "2024-01-22",
    status: "in-review",
    documentStatus: "preparing",
    documents: [],
    closingDate: null,
    titleCompany: null,
    mlsNumber: null,
  },
  {
    id: "4",
    dealId: "4",
    propertyAddress: "2222 Elm Court, Berkeley, MO 63134",
    offerPrice: 78000,
    submittedDate: "2024-01-15",
    status: "countered",
    documentStatus: "revision-needed",
    counterOfferPrice: 82000,
    documents: [],
    closingDate: null,
    titleCompany: null,
    mlsNumber: "STL12346",
  },
  {
    id: "5",
    dealId: "5",
    propertyAddress: "3333 Cedar Lane, Normandy, MO 63121",
    offerPrice: 45000,
    submittedDate: "2024-01-10",
    status: "rejected",
    documentStatus: "none",
    documents: [],
    closingDate: null,
    titleCompany: null,
    mlsNumber: null,
  },
];

const offerStatusConfig = {
  submitted: {
    label: "Submitted",
    icon: Send,
    color: "bg-blue-100 text-blue-800",
  },
  "in-review": {
    label: "In Review",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  "pending-signature": {
    label: "Awaiting Signature",
    icon: FileSignature,
    color: "bg-purple-100 text-purple-800",
  },
  countered: {
    label: "Counter Offer",
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-800",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Not Accepted",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800",
  },
};

const documentStatusLabels = {
  none: "No Documents",
  preparing: "Preparing Documents",
  "awaiting-signature": "Awaiting Your Signature",
  "revision-needed": "Revision Needed",
  signed: "All Signed",
};

const PortalMyOffers = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOffers = mockOffers.filter((offer) => {
    return statusFilter === "all" || offer.status === statusFilter;
  });

  const getDocumentProgress = (documents: { status: string }[]) => {
    if (documents.length === 0) return 0;
    const signedCount = documents.filter((d) => d.status === "signed").length;
    return (signedCount / documents.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">My Offers</h1>
        <p className="text-muted-foreground text-sm">
          Track your offer submissions and document signing status.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-accent/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileSignature className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Document Automation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Offer documents are automatically generated from your submission and sent via 
              Dotloop for e-signature. You'll receive an email when documents are ready to sign.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in-review">In Review</SelectItem>
            <SelectItem value="pending-signature">Awaiting Signature</SelectItem>
            <SelectItem value="countered">Counter Offer</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Not Accepted</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filteredOffers.length} offer{filteredOffers.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => {
          const status = offerStatusConfig[offer.status as keyof typeof offerStatusConfig];
          const StatusIcon = status?.icon || Clock;
          const documentProgress = getDocumentProgress(offer.documents);

          return (
            <div
              key={offer.id}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSignature className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        to={`/portal/investor/deals/${offer.dealId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {offer.propertyAddress}
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>Offer: ${offer.offerPrice.toLocaleString()}</span>
                        {offer.mlsNumber && (
                          <Badge variant="outline" className="text-xs">
                            MLS #{offer.mlsNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Submitted: {new Date(offer.submittedDate).toLocaleDateString()}</span>
                    {offer.closingDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Closing: {new Date(offer.closingDate).toLocaleDateString()}
                      </span>
                    )}
                    {offer.titleCompany && (
                      <span>Title: {offer.titleCompany}</span>
                    )}
                  </div>
                </div>

                <Badge className={status?.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status?.label}
                </Badge>
              </div>

              {/* Counter Offer */}
              {offer.status === "countered" && offer.counterOfferPrice && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">
                        Counter Offer: ${offer.counterOfferPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Contact Integrity Realty STL to discuss next steps.
                      </p>
                    </div>
                    <Link to="/portal/investor/consulting">
                      <Button variant="outline" size="sm">
                        Discuss
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Document Status */}
              {offer.documents.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-foreground">
                      Document Status: {documentStatusLabels[offer.documentStatus as keyof typeof documentStatusLabels]}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {offer.documents.filter((d) => d.status === "signed").length} / {offer.documents.length} signed
                    </span>
                  </div>
                  <Progress value={documentProgress} className="h-2 mb-3" />

                  <div className="space-y-2">
                    {offer.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm bg-accent/50 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === "signed" ? (
                            <>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Signed
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Download className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {offer.documentStatus === "awaiting-signature" && (
                    <Button className="mt-4 w-full" size="sm">
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Documents in Dotloop
                    </Button>
                  )}
                </div>
              )}

              {/* Preparing Documents */}
              {offer.documentStatus === "preparing" && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Preparing Documents
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Your offer is being reviewed. Documents will be sent for signature once approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredOffers.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <FileSignature className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No offers found.</p>
          <Link to="/portal/investor/deals">
            <Button>Browse Deals</Button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> Submitting an offer request 
          does not constitute an accepted offer or binding agreement. Offer documents are generated 
          by Integrity Realty STL and require e-signature through Dotloop. Investors may view but 
          not edit documents after generation.
        </p>
      </div>
    </div>
  );
};

export default PortalMyOffers;
