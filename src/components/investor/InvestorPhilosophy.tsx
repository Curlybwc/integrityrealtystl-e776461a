import { MapPin, Home, Calculator, RefreshCw } from "lucide-react";

const InvestorPhilosophy = () => {
  const pillars = [
    {
      icon: MapPin,
      title: "North County St. Louis Focus",
      description:
        "We concentrate on neighborhoods we know deeply—understanding rental demand, tenant demographics, and long-term market dynamics.",
    },
    {
      icon: Home,
      title: "Functional, Durable Rehabs",
      description:
        "Our approach emphasizes affordable housing with quality, functional renovations that minimize deferred maintenance and maximize tenant satisfaction.",
    },
    {
      icon: Calculator,
      title: "Rent-to-Price Discipline",
      description:
        "We target properties with approximately 1.3% or greater rent-to-price ratio. This is a guideline, not a guarantee—every deal is evaluated individually.",
    },
    {
      icon: RefreshCw,
      title: "BRRR Strategy When Feasible",
      description:
        "Buy, Rehab, Rent, Refinance, Repeat. When conditions allow, we help investors recycle capital efficiently—but not every deal fits this model.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Our Investment Philosophy
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Understanding how we think about deals helps you decide if we're the right partner. 
          Here's what guides our approach.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Important Clarification */}
        <div className="mt-8 bg-accent/50 border border-border rounded-lg p-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Important:</strong> Not every deal meets every metric. 
            Market conditions change. Numbers shown are examples, not guarantees. 
            We share our philosophy so you understand how decisions are made—not to promise specific outcomes.
          </p>
        </div>
      </div>
    </section>
  );
};

export default InvestorPhilosophy;
