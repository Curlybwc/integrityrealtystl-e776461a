import { MapPin, Target, Camera, Scale } from "lucide-react";

const SellerValueProposition = () => {
  const values = [
    {
      icon: MapPin,
      title: "Local Market Expertise",
      description:
        "We know the St. Louis market—neighborhoods, buyer demographics, and pricing trends. This knowledge informs every recommendation we make.",
    },
    {
      icon: Target,
      title: "Strategic Pricing",
      description:
        "Pricing your home correctly from the start attracts serious buyers and maximizes your outcome. We use comparable sales and market analysis—not guesswork.",
    },
    {
      icon: Camera,
      title: "Professional Marketing",
      description:
        "Your property deserves to be presented at its best. We provide professional photography, compelling descriptions, and full MLS exposure.",
    },
    {
      icon: Scale,
      title: "Skilled Negotiation",
      description:
        "From offer review to contract negotiations, we advocate for your interests and guide you through every decision with clarity and confidence.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Why List With Integrity Realty STL?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Selling your home is a significant decision. Here's how we help you 
          navigate the process with confidence.
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

export default SellerValueProposition;
