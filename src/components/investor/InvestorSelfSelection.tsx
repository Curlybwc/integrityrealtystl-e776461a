import { CheckCircle, XCircle } from "lucide-react";

const InvestorSelfSelection = () => {
  const forYou = [
    "Comfortable with rental property ownership",
    "Understand that real estate involves risk",
    "Willing to perform your own due diligence",
    "Seeking long-term, sustainable investing over speculation",
  ];

  const notForYou = [
    "Looking for a primary residence to live in",
    "Expecting guaranteed returns or passive income",
    "Unwilling to engage in investment decisions",
    "Seeking short-term speculation or flipping",
  ];

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-5xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          Is This Track Right for You?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          We believe in alignment over volume. Please take a moment to determine 
          if our investment approach matches your goals.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* This IS for you */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <h3 className="font-serif text-xl text-foreground mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              This Track Is For You If...
            </h3>
            <ul className="space-y-4">
              {forYou.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* This is NOT for you */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-card">
            <h3 className="font-serif text-xl text-foreground mb-6 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              This Track Is Not For You If...
            </h3>
            <ul className="space-y-4">
              {notForYou.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestorSelfSelection;
