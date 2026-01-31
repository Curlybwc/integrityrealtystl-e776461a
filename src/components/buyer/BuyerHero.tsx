import { Home, Heart } from "lucide-react";

const BuyerHero = () => {
  return (
    <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-accent/50 to-background">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Home className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Find Your Next Home
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Whether you're buying your first home or your forever home, we're here to 
          guide you through every step with clarity, care, and local expertise.
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Integrity Realty STL represents people—not just transactions.
        </p>
      </div>
    </section>
  );
};

export default BuyerHero;
