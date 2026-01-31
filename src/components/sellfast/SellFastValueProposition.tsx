import { Lightbulb, Scale, DollarSign } from "lucide-react";

const SellFastValueProposition = () => {
  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-3xl text-center text-foreground mb-4">
          What "Sell Fast" Actually Means
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Many sellers assume that "AS-IS" means "cash buyer only." That's not true. 
          Let's clear up some common misconceptions.
        </p>

        <div className="space-y-6">
          {/* Key Clarification 1 */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  You Can List AS-IS on the MLS
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Properties can absolutely be listed AS-IS on the open market. In many cases, 
                  AS-IS MLS listings attract multiple buyers and <em>typically</em> result in 
                  higher offers than off-market cash sales. However, no price or outcome is ever guaranteed.
                </p>
              </div>
            </div>
          </div>

          {/* Key Clarification 2 */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  Cash Offers Prioritize Convenience—Not Maximum Price
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The "Sell Fast" option is a <em>convenience-based</em> alternative. It's appropriate 
                  when you prioritize speed, simplicity, certainty, or minimal involvement. It is 
                  not positioned as a superior financial outcome—because it typically isn't.
                </p>
              </div>
            </div>
          </div>

          {/* Key Clarification 3 - Profit Disclosure */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-foreground mb-2">
                  We're Transparent About Our Incentives
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Any cash offer made by Integrity Realty STL or its partners is intended to 
                  generate a profit. We may renovate and resell the property, or hold it as 
                  a rental. Our offers reflect assumed risk, renovation costs, holding costs, 
                  and the convenience we provide. You deserve to know this.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellFastValueProposition;
