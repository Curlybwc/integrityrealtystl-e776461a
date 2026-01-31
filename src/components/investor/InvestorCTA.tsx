import { Button } from "@/components/ui/button";
import { ArrowRight, Lock } from "lucide-react";

const InvestorCTA = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById("apply");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 px-6 bg-primary/5">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="font-serif text-3xl text-foreground mb-4">
          Ready to Take the Next Step?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          If our approach aligns with your investment philosophy, we invite you to 
          apply for Investor Portal access. We'll review your application and 
          reach out to discuss next steps.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" onClick={scrollToForm}>
            Apply for Portal Access
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Already approved?</span>
            <a href="#" className="text-primary hover:underline">
              Portal Login
            </a>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Portal access requires review and agreement execution. Not all applicants 
          will be approved.
        </p>
      </div>
    </section>
  );
};

export default InvestorCTA;
