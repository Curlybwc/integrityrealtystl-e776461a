import { Zap, Eye, Shield, Users } from "lucide-react";

const WholesalerBenefits = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Immediate Publishing",
      description:
        "Once approved, your deals go live immediately—no waiting for manual review on each submission.",
    },
    {
      icon: Users,
      title: "Access to Qualified Investors",
      description:
        "Your deals are shown only to our vetted, active investor network looking for off-market opportunities.",
    },
    {
      icon: Eye,
      title: "Privacy Protected",
      description:
        "Your contact information is never shared with investors. Integrity Realty STL manages all communications.",
    },
    {
      icon: Shield,
      title: "Professional Partnership",
      description:
        "Work with a licensed brokerage that values transparency, efficiency, and long-term relationships.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Why Partner With Us?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          We've built a system that benefits serious wholesalers: fast publishing, 
          qualified buyers, and a professional intermediary.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WholesalerBenefits;
