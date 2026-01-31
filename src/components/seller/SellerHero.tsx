import { Building, Award } from "lucide-react";

const SellerHero = () => {
  return (
    <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-accent/50 to-background">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Building className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          List Your Property with Confidence
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          When you're ready to sell, you deserve strategic pricing, professional 
          marketing, and an experienced advocate working to get you the best 
          possible terms.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Award className="w-4 h-4 text-primary" />
          <span>Full MLS exposure. Local expertise. Professional representation.</span>
        </div>
      </div>
    </section>
  );
};

export default SellerHero;
