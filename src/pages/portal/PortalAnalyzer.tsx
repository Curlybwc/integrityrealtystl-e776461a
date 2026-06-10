import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DealAnalyzer from "@/components/portal/DealAnalyzer";
import PreviewQuotaGate, { PreviewQuotaChip } from "@/components/portal/PreviewQuotaGate";
import { useAnalyzerQuota } from "@/hooks/useAnalyzerQuota";

const PortalAnalyzer = () => {
  const navigate = useNavigate();
  const { recordRun, isExhausted } = useAnalyzerQuota();
  const recorded = useRef(false);

  // Record one run per page-load (page-as-session). Server-side tier still gates saves.
  useEffect(() => {
    if (!recorded.current && !isExhausted) {
      recorded.current = true;
      void recordRun("analyzer", { entry: "page_load" });
    }
  }, [isExhausted, recordRun]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => {
          if (window.opener) {
            window.close();
          } else {
            navigate("/portal/investor/search-analyzer");
          }
        }}
        className="mb-4 text-sm font-medium text-primary hover:underline"
      >
        ← Back to Deals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-foreground mb-2">Deal Analyzer</h1>
          <p className="text-muted-foreground text-sm">
            Evaluate potential investments using North County St. Louis market data.
          </p>
        </div>
        <PreviewQuotaChip />
      </div>

      <PreviewQuotaGate portal="investor" toolLabel="deal analyses" />

      {!isExhausted && (
        <>
          {/* Warning */}
          <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
              <p className="text-sm text-muted-foreground">
                This tool is for informational and educational purposes only. Results do not
                constitute investment advice or pass/fail determinations. All inputs and outputs
                should be independently verified.
              </p>
            </div>
          </div>

          <DealAnalyzer />
        </>
      )}
    </div>
  );
};

export default PortalAnalyzer;
