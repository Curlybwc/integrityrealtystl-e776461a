import { MessageSquare, FileCheck, Search, FileSignature, KeyRound } from "lucide-react";

const BuyerProcess = () => {
  const steps = [
    {
      icon: MessageSquare,
      step: "1",
      title: "Initial Consultation",
      description:
        "We start with a conversation about your needs, timeline, and what matters most to you in a home.",
      expectation: "Share your priorities and ask any questions you have about the process.",
    },
    {
      icon: FileCheck,
      step: "2",
      title: "Financing & Pre-Approval",
      description:
        "We help connect you with trusted lenders and guide you through getting pre-approved, so you know your budget.",
      expectation: "Gather financial documents and complete the lender's application process.",
    },
    {
      icon: Search,
      step: "3",
      title: "Home Search & Showings",
      description:
        "Based on your criteria, we'll find homes that match and schedule showings at times that work for you.",
      expectation: "Let us know what you like and don't like—feedback helps us refine the search.",
    },
    {
      icon: FileSignature,
      step: "4",
      title: "Offer & Negotiation",
      description:
        "When you find the right home, we'll help you craft a competitive offer and negotiate on your behalf.",
      expectation: "Review the offer details and be ready to make decisions as negotiations progress.",
    },
    {
      icon: KeyRound,
      step: "5",
      title: "Inspection & Closing",
      description:
        "We'll guide you through inspections, address any concerns, and walk you through closing day—until the keys are yours.",
      expectation: "Attend the inspection, review closing documents, and prepare for move-in.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          The Home Buying Process
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Knowing what to expect makes everything easier. Here's how we'll work 
          together from start to finish.
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

export default BuyerProcess;
