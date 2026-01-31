import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

const BuyerSearchCTA = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById("buyer-inquiry");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card border border-border rounded-lg p-8 shadow-card text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Search className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-foreground mb-4">
            Ready to Start Your Home Search?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Tell us about what you're looking for and we'll help you find homes 
            that match your needs. No pressure, no obligations—just helpful guidance.
          </p>
          <Button size="lg" onClick={scrollToForm}>
            Get Help Finding Your Next Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            We'll reach out personally to understand your needs and start the search together.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BuyerSearchCTA;
