import { Handshake, Shield } from "lucide-react";

const WholesalerHero = () => {
  return (
    <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-accent/50 to-background">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Handshake className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Wholesaler Partnership
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Submit off-market deals to our investor network. Approved wholesalers 
          can publish deals directly—no manual approval required for each submission.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Only approved wholesalers may publish deals.</span>
        </div>
      </div>
    </section>
  );
};

export default WholesalerHero;
