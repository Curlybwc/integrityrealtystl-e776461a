import { Info } from "lucide-react";
import { Link } from "react-router-dom";

const SellerDisclaimers = () => {
  return (
    <section className="py-8 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        {/* Sell Fast Alternative Link */}
        <div className="text-center mb-8 pb-8 border-b border-border">
          <p className="text-sm text-muted-foreground">
            Looking to sell as-is or need a faster solution?{" "}
            <Link to="/sellfast" className="text-primary hover:underline font-medium">
              Explore Sell Fast options →
            </Link>
          </p>
        </div>

        {/* Disclaimers */}
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>
              Market conditions can change. Listing price and time on market are influenced by 
              many factors and cannot be guaranteed. Information provided is believed to be 
              accurate but is not guaranteed.
            </p>
            <p>
              Integrity Realty STL does not guarantee the sale of any property or any specific 
              outcome. Sellers should consult with qualified professionals regarding legal, 
              tax, and financial matters.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellerDisclaimers;
