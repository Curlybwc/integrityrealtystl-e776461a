import { TrendingUp } from "lucide-react";

const InvestorHero = () => {
  return (
    <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-accent/50 to-background">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-6">
          Invest with Integrity
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Build lasting wealth through curated long-term rental investment opportunities 
          in North County St. Louis—with transparency, education, and alignment at every step.
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          This track is designed for serious investors seeking sustainable, cash-flowing 
          rental properties—not speculation, not guarantees, but real partnership built on trust.
        </p>
      </div>
    </section>
  );
};

export default InvestorHero;
