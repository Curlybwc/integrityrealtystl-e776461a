import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearActiveImpersonation, useImpersonation } from "@/hooks/useImpersonation";
import { useToast } from "@/hooks/use-toast";

/**
 * Support-view impersonation banner.
 * Important: this does NOT swap Supabase auth/session tokens.
 * It only tracks an explicit admin support session for visibility + auditing.
 */
const ImpersonationBanner = () => {
  const { active } = useImpersonation();
  const { toast } = useToast();

  if (!active) return null;

  const endImpersonation = async () => {
    const { error } = await supabase.rpc("admin_end_impersonation", {
      _session_id: active.sessionId,
      _revoked: false,
    });

    if (error) {
      toast({ title: "Failed to end impersonation", description: error.message, variant: "destructive" });
      return;
    }

    clearActiveImpersonation();
    toast({ title: "Impersonation ended" });
  };

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-amber-100 border-b border-amber-300 px-4 py-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm">
        <div className="text-amber-900">
          <strong>Support View Mode Active:</strong> Admin <strong>{active.adminEmail}</strong> viewing context for <strong>{active.targetEmail}</strong>. Reason: {active.reason}. This is not a true auth-session switch.
        </div>
        <Button size="sm" variant="secondary" onClick={() => void endImpersonation()}>
          Exit Impersonation
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
