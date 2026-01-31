import { Home, ArrowRight } from "lucide-react";

const InvestorCaseStudies = () => {
  const examples = [
    {
      title: "3-Bedroom Brick Ranch",
      location: "Florissant, MO",
      purchaseRange: "$65,000 - $85,000",
      rentRange: "$1,050 - $1,200/month",
      rehabPhilosophy:
        "Full mechanical update, modern kitchen, LVP flooring throughout. Focus on durability over cosmetic upgrades.",
    },
    {
      title: "4-Bedroom Cape Cod",
      location: "Ferguson, MO",
      purchaseRange: "$55,000 - $75,000",
      rentRange: "$1,100 - $1,300/month",
      rehabPhilosophy:
        "Foundation repair, updated electrical, energy-efficient windows. Addressed deferred maintenance before cosmetics.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Example Deals
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
          These examples illustrate the types of properties we work with and our approach to rehab. 
          They are historical or illustrative—not currently available deals.
        </p>
        <p className="text-center text-xs text-muted-foreground mb-12 max-w-xl mx-auto">
          <strong>Disclaimer:</strong> Past examples do not guarantee similar deals are currently 
          available or that future deals will perform similarly.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {examples.map((example, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg overflow-hidden shadow-card"
            >
              {/* Placeholder for Before/After Images */}
              <div className="h-48 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Home className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Before/After Photos
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-serif text-lg text-foreground mb-1">
                  {example.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {example.location}
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Range:</span>
                    <span className="text-foreground font-medium">
                      {example.purchaseRange}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent Range:</span>
                    <span className="text-foreground font-medium">
                      {example.rentRange}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Rehab Philosophy:</strong>{" "}
                    {example.rehabPhilosophy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Active, actionable deals are available only to approved investors inside the Investor Portal.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InvestorCaseStudies;
