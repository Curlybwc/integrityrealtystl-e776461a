import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  MapPin,
  Calendar,
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

// Mock bid data
const mockBids = [
  {
    id: "1",
    dealId: "1",
    propertyAddress: "1234 Oak Street, Florissant, MO 63033",
    contractorName: "Mike's Renovation Co.",
    requestDate: "2024-01-18",
    status: "completed",
    bidFeeRequired: true,
    bidFeeAmount: 150,
    paymentStatus: "paid",
    bidAmount: 24500,
    bidDocument: "bid-1234-oak.pdf",
    turnaroundDays: 4,
    shareAuthorized: true,
  },
  {
    id: "2",
    dealId: "2",
    propertyAddress: "5678 Maple Avenue, Ferguson, MO 63135",
    contractorName: "STL Property Inspections",
    requestDate: "2024-01-20",
    status: "scheduled",
    scheduledDate: "2024-01-25",
    bidFeeRequired: true,
    bidFeeAmount: 75,
    paymentStatus: "paid",
    bidAmount: null,
    bidDocument: null,
    shareAuthorized: false,
  },
  {
    id: "3",
    dealId: "3",
    propertyAddress: "9101 Pine Drive, Jennings, MO 63136",
    contractorName: "Budget Rehab Solutions",
    requestDate: "2024-01-22",
    status: "pending-payment",
    bidFeeRequired: true,
    bidFeeAmount: 150,
    paymentStatus: "unpaid",
    bidAmount: null,
    bidDocument: null,
    shareAuthorized: false,
  },
  {
    id: "4",
    dealId: "4",
    propertyAddress: "2222 Elm Court, Berkeley, MO 63134",
    contractorName: "Mike's Renovation Co.",
    requestDate: "2024-01-15",
    status: "pending-approval",
    bidFeeRequired: false,
    bidFeeAmount: 0,
    paymentStatus: null,
    bidAmount: null,
    bidDocument: null,
    shareAuthorized: true,
  },
];

const statusConfig = {
  "pending-payment": {
    label: "Payment Pending",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-800",
  },
  "pending-approval": {
    label: "Awaiting Approval",
    icon: Clock,
    color: "bg-blue-100 text-blue-800",
  },
  scheduled: {
    label: "Scheduled",
    icon: Calendar,
    color: "bg-purple-100 text-purple-800",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800",
  },
};

const PortalMyBids = () => {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBids = mockBids.filter((bid) => {
    return statusFilter === "all" || bid.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">My Bid Requests</h1>
        <p className="text-muted-foreground text-sm">
          Track your contractor bid requests and download completed bids.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending-payment">Payment Pending</SelectItem>
            <SelectItem value="pending-approval">Awaiting Approval</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filteredBids.length} bid{filteredBids.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        {filteredBids.map((bid) => {
          const status = statusConfig[bid.status as keyof typeof statusConfig];
          const StatusIcon = status?.icon || Clock;

          return (
            <div
              key={bid.id}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        to={`/portal/deals/${bid.dealId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {bid.propertyAddress}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {bid.contractorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Requested: {new Date(bid.requestDate).toLocaleDateString()}</span>
                    {bid.scheduledDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Scheduled: {new Date(bid.scheduledDate).toLocaleDateString()}
                      </span>
                    )}
                    {bid.shareAuthorized && (
                      <Badge variant="outline" className="text-xs">
                        Sharing Authorized
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={status?.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status?.label}
                  </Badge>
                </div>
              </div>

              {/* Payment Warning */}
              {bid.status === "pending-payment" && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      Payment Required: ${bid.bidFeeAmount}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Complete payment directly to the contractor to proceed with scheduling.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    Pay Now
                  </Button>
                </div>
              )}

              {/* Completed Bid */}
              {bid.status === "completed" && bid.bidDocument && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Bid Complete: ${bid.bidAmount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-700">
                          Completed in {bid.turnaroundDays} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredBids.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No bid requests found.</p>
          <Link to="/portal/deals">
            <Button>Browse Deals</Button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> Contractor bids are 
          independent third-party estimates. Integrity Realty STL does not verify scope, 
          pricing, or contractor performance. Bids are read-only and may not be modified by investors.
        </p>
      </div>
    </div>
  );
};

export default PortalMyBids;
