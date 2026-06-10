import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccessTier, type AccessTier } from "@/hooks/useAccessTier";

const rank: Record<AccessTier, number> = { preview: 0, browse: 1, full: 2 };

interface Props {
  requiredTier: "browse" | "full";
  portal?: "investor" | "wholesaler" | "partner";
  children: ReactNode;
  featureName?: string;
}

const TierGuard = ({ requiredTier, portal = "investor", children, featureName }: Props) => {
  const { tier, loading, isAdmin } = useAccessTier();

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>;
  }

  if (isAdmin || rank[tier] >= rank[requiredTier]) return <>{children}</>;

  const title =
    requiredTier === "full"
      ? `${featureName ?? "This feature"} requires a signed Buyer's Agency Agreement`
      : `${featureName ?? "This feature"} requires a completed profile`;
  const desc =
    requiredTier === "full"
      ? "To submit offers, request walkthroughs, or use other client tools, we need a signed Buyer's Agency Agreement on file. We'll send it to you through Dotloop."
      : "Add your phone and accept the email & SMS alerts to access this feature.";

  return (
    <div className="max-w-xl mx-auto py-16">
      <Card className="border-primary/30">
        <CardContent className="py-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-foreground mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <Button asChild>
            <Link to={`/portal/${portal}/onboarding`}>Complete setup</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TierGuard;
