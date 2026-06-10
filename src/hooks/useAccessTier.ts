import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AccessTier = "preview" | "browse" | "full";

export interface AccessTierProfile {
  phone: string | null;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  baa_status: "not_required" | "not_sent" | "sent" | "signed" | "verified";
  baa_signed_at: string | null;
  preview_quota_limit: number;
}

interface UseAccessTierResult {
  tier: AccessTier;
  loading: boolean;
  profile: AccessTierProfile | null;
  isBuyerSide: boolean; // investor role
  isAdmin: boolean;
  refresh: () => Promise<void>;
  contactComplete: boolean;
  needsBaa: boolean;
}

export function useAccessTier(): UseAccessTierResult {
  const [tier, setTier] = useState<AccessTier>("preview");
  const [profile, setProfile] = useState<AccessTierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBuyerSide, setIsBuyerSide] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) {
      setTier("preview");
      setProfile(null);
      setLoading(false);
      return;
    }

    const [tierRes, profRes, rolesRes] = await Promise.all([
      supabase.rpc("get_access_tier", { _user_id: uid }),
      supabase
        .from("profiles")
        .select("phone, sms_opt_in, email_opt_in, baa_status, baa_signed_at, preview_quota_limit")
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);

    const roles = (rolesRes.data ?? []).map((r) => r.role as string);
    setIsAdmin(roles.includes("admin"));
    setIsBuyerSide(roles.includes("investor"));

    if (tierRes.data && typeof tierRes.data === "string") {
      setTier(tierRes.data as AccessTier);
    }
    if (profRes.data) {
      setProfile(profRes.data as AccessTierProfile);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const contactComplete = !!(
    profile &&
    profile.phone &&
    profile.phone.replace(/\D/g, "").length >= 10 &&
    profile.sms_opt_in &&
    profile.email_opt_in
  );

  const needsBaa =
    isBuyerSide && !isAdmin && (!profile || !["signed", "verified"].includes(profile.baa_status));

  return { tier, loading, profile, isBuyerSide, isAdmin, refresh: load, contactComplete, needsBaa };
}
