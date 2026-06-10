import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAnalyzerQuota } from "@/hooks/useAnalyzerQuota";
import { useAccessTier } from "@/hooks/useAccessTier";

interface Props {
  portal?: "investor" | "wholesaler" | "partner";
  toolLabel?: string;
}

/**
 * Renders an upsell card when the preview-tier quota is exhausted.
 * Returns null if user is allowed (browse/full tier or quota remaining).
 */
const PreviewQuotaGate = ({ portal = "investor", toolLabel = "analyses" }: Props) => {
  const { tier, loading: tierLoading, isAdmin } = useAccessTier();
  const { isExhausted, isUnlimited, remaining, loading } = useAnalyzerQuota();

  if (loading || tierLoading) return null;
  if (isAdmin || isUnlimited || tier !== "preview") return null;
  if (!isExhausted) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-foreground mb-2">
            You've used your preview {toolLabel}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Complete your profile and sign your Buyer's Agency Agreement to unlock unlimited
            searches, deal analyses, saved deals, and offer submissions.
          </p>
        </div>
        <Button asChild>
          <Link to={`/portal/${portal}/onboarding`}>
            <Sparkles className="w-4 h-4 mr-2" />
            Unlock full access
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PreviewQuotaGate;

/**
 * Inline chip showing remaining preview runs.
 */
export const PreviewQuotaChip = () => {
  const { tier, isAdmin } = useAccessTier();
  const { remaining, isUnlimited } = useAnalyzerQuota();
  if (isAdmin || isUnlimited || tier !== "preview" || remaining === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
      <Sparkles className="w-3 h-3" />
      {remaining} preview run{remaining === 1 ? "" : "s"} left
    </span>
  );
};
