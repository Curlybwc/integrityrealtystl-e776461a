import { Clock, Heart } from "lucide-react";

const SellFastHero = () => {
  return (
    <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-accent/50 to-background">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Explore Your Selling Options
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          If you're considering selling your property quickly or AS-IS, you have more 
          options than you might think. We're here to help you understand them clearly—not 
          to pressure you into any decision.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="w-4 h-4 text-primary" />
          <span>No pressure. No obligations. Just honest information.</span>
        </div>
      </div>
    </section>
  );
};

export default SellFastHero;
