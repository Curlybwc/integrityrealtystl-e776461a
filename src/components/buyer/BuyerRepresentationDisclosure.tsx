import { FileText, Scale } from "lucide-react";

const BuyerRepresentationDisclosure = () => {
  return (
    <section className="py-12 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-accent/50 border border-border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground mb-2">
                About Buyer Representation
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Integrity Realty STL is a licensed real estate brokerage that represents 
                  buyers in the purchase of residential property.
                </p>
                <p>
                  Formal representation may require a Buyer Agency Agreement, which we will 
                  explain in detail before you submit an offer on any property. This agreement 
                  outlines our responsibilities to you and how we work together.
                </p>
                <p className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    We'll walk you through everything clearly—no surprises, no pressure.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyerRepresentationDisclosure;
