import { Building2, Zap, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SellFastComparison = () => {
  const mlsFeatures = [
    "Full MLS exposure to all buyers",
    "Multiple buyers may compete",
    "Typically higher offers",
    "Longer or variable timeline",
    "Buyers may use financing",
    "No guarantee of price or timing",
  ];

  const cashFeatures = [
    "No MLS exposure",
    "Single buyer or limited competition",
    "Lower offers (convenience trade-off)",
    "Faster, more predictable timeline",
    "Cash or alternative financing",
    "No guarantee of offer",
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Compare Your Options
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Here's a clear, side-by-side look at AS-IS MLS listing versus the Sell Fast 
          cash option. Both are legitimate—choose based on your priorities.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AS-IS MLS Option */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-card">
            <div className="bg-primary/5 p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-xl text-foreground">
                  AS-IS MLS Listing
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                List your property on the open market, sold AS-IS
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {mlsFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/sellers">
                <Button variant="outline" className="w-full">
                  Learn About AS-IS Listings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sell Fast / Cash Option */}
          <div className="bg-card border-2 border-primary rounded-lg overflow-hidden shadow-card">
            <div className="bg-primary/10 p-6 border-b border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-serif text-xl text-foreground">
                  Sell Fast / Cash Option
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Sell directly for speed and convenience
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {cashFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => {
                  const form = document.getElementById("sellfast-form");
                  form?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Request a Sell Fast Evaluation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Clarifying Note */}
        <div className="mt-8 bg-accent/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Important:</strong> While AS-IS MLS listings 
            often result in higher offers, market conditions vary and no outcome can be guaranteed. 
            Both options have trade-offs—choose based on what matters most to you.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SellFastComparison;
