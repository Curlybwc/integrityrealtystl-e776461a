import { AlertCircle } from "lucide-react";
import DealAnalyzer from "@/components/portal/DealAnalyzer";

const PortalAnalyzer = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Deal Analyzer
        </h1>
        <p className="text-muted-foreground text-sm">
          Evaluate potential investments using North County St. Louis market data.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
          <p className="text-sm text-muted-foreground">
            This tool is for informational and educational purposes only. 
            Results do not constitute investment advice or pass/fail determinations. 
            All inputs and outputs should be independently verified.
          </p>
        </div>
      </div>

      {/* Deal Analyzer */}
      <DealAnalyzer />
    </div>
  );
};

export default PortalAnalyzer;
