import { Link } from "react-router-dom";
import {
  Building2,
  FileText,
  Wrench,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PortalDashboard = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-card">
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Welcome to Your Investor Portal
        </h1>
        <p className="text-muted-foreground">
          This is your private dashboard for viewing deals, submitting offers, and accessing 
          resources. Take a moment to understand how everything works.
        </p>
      </div>

      {/* Notice Area */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Latest Updates</p>
          <p className="text-sm text-muted-foreground">
            New deals are added regularly. Check back often or wait for notifications. 
            Remember: all deals are subject to availability and may be removed at any time.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">How the Portal Works</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Jen's Picks</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Curated deals hand-selected by Integrity Realty STL. These are properties 
              we believe offer strong potential based on our criteria.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">MLS Deals</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Properties sourced from the MLS that meet our investment criteria. 
              Standard financing may be available.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Wholesaler Deals</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Off-market opportunities submitted by approved wholesalers. Information 
              provided by third parties—verify independently.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Availability</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Deals appear and disappear as they become available or are sold. 
              There's no guarantee any specific deal will be available.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Quick Actions</h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/portal/deals">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>View Deals</span>
            </Button>
          </Link>

          <Link to="/portal/deals">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Submit Offer</span>
            </Button>
          </Link>

          <Link to="/portal/deals">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              <span>Request Walkthrough</span>
            </Button>
          </Link>

          <Link to="/portal/consulting">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>Consulting Request</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Important:</strong> All investments involve risk. 
          Past performance does not guarantee future results. Information provided is for 
          informational purposes only and does not constitute investment advice. Investors 
          must conduct their own due diligence and verify all information independently. 
          Integrity Realty STL does not guarantee deal availability, property condition, 
          financial projections, or investment outcomes.
        </p>
      </div>
    </div>
  );
};

export default PortalDashboard;
