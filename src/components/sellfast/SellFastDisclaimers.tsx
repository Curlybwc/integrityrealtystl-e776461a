import { AlertCircle, DollarSign, Scale, FileText } from "lucide-react";

const SellFastDisclaimers = () => {
  return (
    <section className="py-16 px-6 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-8">
          Important Disclosures
        </h2>

        <div className="space-y-6">
          {/* Primary Sell Fast Disclaimer */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Sell Fast Disclosure
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Sell Fast option prioritizes convenience and speed and may result in 
                  a lower sale price than a traditional MLS listing. Integrity Realty STL 
                  does not guarantee an offer, price, or timeline. Sellers are encouraged 
                  to consider all available options before making a decision.
                </p>
              </div>
            </div>
          </div>

          {/* Profit Disclosure */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Profit Disclosure
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Any cash offer provided by Integrity Realty STL or its partners is made 
                  with the intention of earning a profit through renovation, resale, or 
                  rental of the property. Offers reflect the convenience, risk, and costs 
                  assumed by the buyer.
                </p>
              </div>
            </div>
          </div>

          {/* Agency Disclosure */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Representation & Agency
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Integrity Realty STL is a licensed real estate brokerage. No agency 
                  relationship is created by form submission alone. Any transaction or 
                  representation requires appropriate written agreements, which will be 
                  explained before any commitments are made.
                </p>
              </div>
            </div>
          </div>

          {/* No Guarantee */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  No Guaranteed Outcomes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Submitting an inquiry does not guarantee that an offer will be made. 
                  Integrity Realty STL reserves the right to decline to make an offer, 
                  recommend an AS-IS MLS listing instead, or refer sellers to other 
                  appropriate resources based on the specific situation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellFastDisclaimers;
