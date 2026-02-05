import { Link } from "react-router-dom";
import { Building2, Store, Bell, ArrowRight } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";

const PortalDealsHub = () => {
  const { deals } = useDeals();
  
  const mlsDeals = deals.filter(d => d.source_type === "MLS" && d.buyer_visible);
  const wholesaleDeals = deals.filter(d => d.source_type === "WHOLESALER" && d.buyer_visible);
  const alertDeals = deals.filter(d => d.flagged_for_alert && d.buyer_visible);

  const hubCards = [
    {
      title: "MLS Deals",
      description: "Auto-screened MLS listings that pass Turnkey or BRRRR strategies. Updated daily from the MLS feed.",
      icon: Building2,
      to: "/portal/deals/mls",
      count: mlsDeals.length,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Wholesaler Deals",
      description: "Off-market opportunities submitted by approved wholesalers. View assignment deals before they hit the market.",
      icon: Store,
      to: "/portal/deals/wholesale",
      count: wholesaleDeals.length,
      color: "bg-secondary/30 text-secondary-foreground",
    },
    {
      title: "Deal Alerts",
      description: "Hot deals flagged for immediate attention. Subscribe to SMS alerts to get notified instantly.",
      icon: Bell,
      to: "/portal/deals/alerts",
      count: alertDeals.length,
      color: "bg-accent text-accent-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Deals Hub</h1>
        <p className="text-muted-foreground text-sm">
          Browse investment opportunities by source. Select a category below.
        </p>
      </div>

      {/* Hub Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {hubCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group block"
            >
              <div className="bg-card border border-border rounded-lg p-6 h-full shadow-card hover:shadow-card-hover transition-all hover:border-primary/50">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-serif text-xl font-medium text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h2>
                  <span className="bg-muted text-muted-foreground text-sm font-medium px-2 py-1 rounded">
                    {card.count}
                  </span>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {card.description}
                </p>
                
                <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  View Deals
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{mlsDeals.length + wholesaleDeals.length}</strong> total deals available • 
          <strong className="text-foreground"> {alertDeals.length}</strong> flagged as hot deals
        </p>
      </div>
    </div>
  );
};

export default PortalDealsHub;
