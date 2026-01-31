import { Info } from "lucide-react";

const BuyerDisclaimers = () => {
  return (
    <section className="py-8 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>
              Home listings are subject to availability and may be sold or withdrawn at any time. 
              Information provided is believed to be accurate but is not guaranteed. 
              Buyers should independently verify all property details, including but not limited 
              to square footage, lot size, schools, and taxes.
            </p>
            <p>
              Integrity Realty STL does not guarantee the availability of any specific property 
              or the outcome of any transaction.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuyerDisclaimers;
