import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAccessTier, type AccessTier } from "@/hooks/useAccessTier";
import { cn } from "@/lib/utils";

interface Props {
  /** Minimum tier required to perform the action. */
  requiredTier: "browse" | "full";
  /** Portal (controls the onboarding link). */
  portal?: "investor" | "wholesaler" | "partner";
  /** Children rendered as the actionable trigger when allowed. */
  children: ReactNode;
  /** Custom label inside the locked popover. */
  blockedTitle?: string;
  blockedDescription?: string;
  className?: string;
}

const tierRank: Record<AccessTier, number> = { preview: 0, browse: 1, full: 2 };

/**
 * Wraps an action (button, link, etc.) and only allows interaction
 * when the user has met the required access tier. Otherwise renders
 * a lock-icon trigger that opens a popover prompting onboarding.
 */
const GatedAction = ({
  requiredTier,
  portal = "investor",
  children,
  blockedTitle,
  blockedDescription,
  className,
}: Props) => {
  const { tier, loading, isAdmin } = useAccessTier();
  const navigate = useNavigate();

  if (loading) {
    return <span className={cn("inline-flex opacity-50", className)}>{children}</span>;
  }

  const allowed = isAdmin || tierRank[tier] >= tierRank[requiredTier];

  if (allowed) {
    return <>{children}</>;
  }

  const onboardingPath = `/portal/${portal}/onboarding`;
  const defaultTitle =
    requiredTier === "full"
      ? "Sign your Buyer's Agency Agreement to use this"
      : "Complete your profile to use this";
  const defaultDesc =
    requiredTier === "full"
      ? "This action is reserved for clients with a signed Buyer's Agency Agreement on file."
      : "Add your phone and accept the email & SMS alerts to unlock this feature.";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            className
          )}
          aria-label="Locked — complete onboarding to use"
        >
          <Lock className="w-4 h-4" />
          <span className="opacity-70">{children}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm text-foreground">{blockedTitle ?? defaultTitle}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {blockedDescription ?? defaultDesc}
              </p>
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={() => navigate(onboardingPath)}>
            Complete setup
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GatedAction;
