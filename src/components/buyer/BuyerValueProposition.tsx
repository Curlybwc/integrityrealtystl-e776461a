import { MapPin, Shield, MessageCircle, Handshake } from "lucide-react";

const BuyerValueProposition = () => {
  const values = [
    {
      icon: MapPin,
      title: "Local Market Knowledge",
      description:
        "We know the St. Louis area neighborhoods, schools, and communities. Our local expertise helps you find the right fit for your lifestyle.",
    },
    {
      icon: Shield,
      title: "Advocacy & Representation",
      description:
        "Your interests come first. We negotiate on your behalf and guide you through every decision with your goals in mind.",
    },
    {
      icon: MessageCircle,
      title: "Clear Communication",
      description:
        "No confusing jargon or pressure. We explain each step in plain language so you always know what's happening and why.",
    },
    {
      icon: Handshake,
      title: "Full Support Through Closing",
      description:
        "From your first showing to handing you the keys, we're with you through inspections, negotiations, and all the paperwork.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Why Work With Us?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Buying a home is one of life's biggest decisions. Here's how we help 
          make the process smooth and stress-free.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BuyerValueProposition;
