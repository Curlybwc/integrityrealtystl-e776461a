import { MessageSquare, BarChart3, Wrench, Megaphone, FileSignature, KeyRound } from "lucide-react";

const SellerProcess = () => {
  const steps = [
    {
      icon: MessageSquare,
      step: "1",
      title: "Initial Consultation",
      description:
        "We meet to discuss your goals, timeline, and answer any questions about selling your property.",
      expectation: "Share your priorities and ask about anything you're unsure of.",
    },
    {
      icon: BarChart3,
      step: "2",
      title: "Market Analysis & Pricing",
      description:
        "We analyze comparable sales and current market conditions to recommend a strategic listing price.",
      expectation: "Review the analysis and discuss pricing strategy together.",
    },
    {
      icon: Wrench,
      step: "3",
      title: "Property Preparation",
      description:
        "We provide guidance on presentation, staging, and any improvements that could impact your sale.",
      expectation: "Decide which preparations make sense for your situation and budget.",
    },
    {
      icon: Megaphone,
      step: "4",
      title: "Professional Marketing",
      description:
        "Your property is professionally photographed, listed on the MLS, and marketed to reach qualified buyers.",
      expectation: "Make the property available for showings and keep it presentation-ready.",
    },
    {
      icon: FileSignature,
      step: "5",
      title: "Offer Review & Negotiation",
      description:
        "We present all offers, explain the terms, and negotiate on your behalf to secure the best outcome.",
      expectation: "Review offers thoughtfully and make decisions with our guidance.",
    },
    {
      icon: KeyRound,
      step: "6",
      title: "Contract to Close",
      description:
        "We coordinate inspections, appraisals, and all the details to ensure a smooth closing day.",
      expectation: "Respond to any requests, prepare for closing, and hand over the keys.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          The Selling Process
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          A clear roadmap from our first conversation to closing day. 
          Here's what to expect at each stage.
        </p>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-serif font-semibold text-lg">
                      {step.step}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-serif text-lg text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  <div className="bg-accent/50 rounded px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">What we'll need from you: </span>
                      {step.expectation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SellerProcess;
