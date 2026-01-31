import { Button } from "@/components/ui/button";
import { FileText, LogIn, ArrowRight } from "lucide-react";

const WholesalerActions = () => {
  const scrollToApplication = () => {
    const formSection = document.getElementById("wholesaler-apply");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-12 px-6 bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Apply Card */}
          <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-card text-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-xl text-foreground mb-2">
              New Wholesaler?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Apply to become an approved wholesaler and gain access to publish 
              deals directly to our investor network.
            </p>
            <Button onClick={scrollToApplication} className="w-full">
              Apply to Become a Wholesaler
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-card text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl text-foreground mb-2">
              Already Approved?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Log in to your Wholesaler Portal to post deals, manage listings, 
              and track your submissions.
            </p>
            <Button variant="outline" className="w-full" disabled>
              <LogIn className="w-4 h-4 mr-2" />
              Wholesaler Login
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Portal access coming soon
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WholesalerActions;
