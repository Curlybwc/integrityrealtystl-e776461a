import { AlertCircle } from "lucide-react";
import Section8Calculator from "@/components/portal/Section8Calculator";

const PortalSection8Calculator = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Section 8 Rent Calculator
        </h1>
        <p className="text-muted-foreground text-sm">
          Verify proposed rents against HUD payment standards for Section 8 eligibility.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
          <p className="text-sm text-muted-foreground">
            This tool uses 2025 HUD Fair Market Rents as a guide. Actual Section 8 
            approval depends on rent reasonableness determinations by your local 
            housing authority. Results are for informational purposes only.
          </p>
        </div>
      </div>

      {/* Calculator */}
      <Section8Calculator />
    </div>
  );
};

export default PortalSection8Calculator;