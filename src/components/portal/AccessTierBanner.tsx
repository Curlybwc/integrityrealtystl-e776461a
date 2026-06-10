import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAccessTier } from "@/hooks/useAccessTier";
import { useAnalyzerQuota } from "@/hooks/useAnalyzerQuota";
import { cn } from "@/lib/utils";

interface Props {
  portal: "investor" | "wholesaler" | "partner";
}

const AccessTierBanner = ({ portal }: Props) => {
  const { tier, loading, profile, isAdmin, isBuyerSide, contactComplete } = useAccessTier();
  const { remaining, isUnlimited } = useAnalyzerQuota();

  if (loading || isAdmin || tier === "full") return null;

  const isInvestor = portal === "investor";
  const onboardingPath = `/portal/${portal}/onboarding`;

  // Determine progress
  const steps: { label: string; done: boolean }[] = [
    { label: "Phone & email opt-ins", done: contactComplete },
  ];
  if (isInvestor) {
    steps.push({
      label: "Signed Buyer's Agency Agreement",
      done: !!profile && ["signed", "verified"].includes(profile.baa_status),
    });
  }
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {tier === "preview"
                ? "You're in Preview mode"
                : "Limited access — finish setup to unlock full features"}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {tier === "preview" && isInvestor && remaining !== null && !isUnlimited && (
                <>
                  <span className="font-semibold text-primary">{remaining}</span> of{" "}
                  {profile?.preview_quota_limit ?? 5} preview analyses left.{" "}
                </>
              )}
              {isInvestor
                ? "Add your phone, accept SMS/email alerts, and sign your Buyer's Agency Agreement to save deals, submit offers, and request walkthroughs."
                : "Add your phone and accept SMS/email alerts to access all portal features."}
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {steps.map((s) => (
                <span
                  key={s.label}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs",
                    s.done ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <CheckCircle2
                    className={cn("w-3.5 h-3.5", s.done ? "text-primary" : "text-muted-foreground/40")}
                  />
                  {s.label}
                </span>
              ))}
              <span className="text-xs text-muted-foreground">
                ({doneCount}/{steps.length} complete)
              </span>
            </div>
          </div>
        </div>
        <Link
          to={onboardingPath}
          className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          Complete setup <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default AccessTierBanner;
