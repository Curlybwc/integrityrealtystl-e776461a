import { TrendingUp, Home, Clock } from "lucide-react";

const SellerPricingEducation = () => {
  const topics = [
    {
      icon: Home,
      title: "How Pricing Is Determined",
      description:
        "Pricing starts with analyzing recent comparable sales—similar properties in your area that have sold recently. We also consider current active listings and market trends to position your home competitively.",
    },
    {
      icon: TrendingUp,
      title: "The Role of Market Conditions",
      description:
        "Buyer demand, interest rates, inventory levels, and seasonal patterns all influence how quickly homes sell and at what price. We'll explain what's happening in your specific market.",
    },
    {
      icon: Clock,
      title: "Timing Considerations",
      description:
        "While there's no perfect time to sell, understanding market cycles and your personal timeline helps us develop a strategy that works for your situation.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Understanding Home Pricing
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Pricing your home is both art and science. Here's how we approach it.
        </p>

        <div className="space-y-6">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 bg-card border border-border rounded-lg p-6 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-foreground mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-accent/50 border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Note:</strong> We don't offer "instant home values" 
            or automated estimates. Accurate pricing requires a thorough analysis of your specific 
            property and current market conditions—which we'll do together during your consultation.
          </p>
        </div>
      </div>
    </section>
  );
};

export default SellerPricingEducation;
