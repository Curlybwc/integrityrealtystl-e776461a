import { ClipboardCheck, UserCheck, Upload, DollarSign } from "lucide-react";

const WholesalerProcess = () => {
  const steps = [
    {
      icon: ClipboardCheck,
      step: "1",
      title: "Submit Your Application",
      description:
        "Tell us about yourself, your markets, and how you source deals. We review applications promptly.",
    },
    {
      icon: UserCheck,
      step: "2",
      title: "Get Approved",
      description:
        "Once approved, you'll receive login credentials to access your Wholesaler Portal.",
    },
    {
      icon: Upload,
      step: "3",
      title: "Post Deals Directly",
      description:
        "Submit deals through your portal. Approved wholesalers publish immediately—no waiting.",
    },
    {
      icon: DollarSign,
      step: "4",
      title: "Close & Get Paid",
      description:
        "When an investor moves forward, Integrity Realty STL facilitates the transaction. You get your assignment fee.",
    },
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          A simple, transparent process from application to closing.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-6 shadow-card flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-serif font-semibold text-lg">
                      {step.step}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <h3 className="font-serif text-lg text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WholesalerProcess;
