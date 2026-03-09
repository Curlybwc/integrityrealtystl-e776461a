import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PortalUser {
  id?: string;
  name: string;
  email?: string;
  company?: string;
}

type PortalType = "investor" | "wholesaler" | "partner" | "admin";

const MOCK_USERS: Record<PortalType, PortalUser> = {
  investor: { name: "John Investor", email: "john@example.com" },
  wholesaler: { name: "Mike Wholesaler", email: "mike@deals.com", company: "Quick Flip Properties" },
  partner: { name: "Partner User", email: "partner@integrityrealty.com" },
  admin: { name: "Admin User", email: "admin@integrityrealty.com" },
};

const mockAuthEnabled = import.meta.env.VITE_ENABLE_MOCK_AUTH !== "false";

export function usePortalAuth(portal: PortalType) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(portal === "admin");
  const [user, setUser] = useState<PortalUser>(MOCK_USERS[portal]);

  useEffect(() => {
    let isMounted = true;

    if (portal !== "admin") {
      if (isMounted) {
        setIsAuthenticated(mockAuthEnabled);
        setLoading(false);
        setUser(MOCK_USERS[portal]);
      }
      return () => {
        isMounted = false;
      };
    }

    const loadAdminAuth = async () => {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(MOCK_USERS.admin);
          setLoading(false);
        }
        return;
      }

      const { data: roleRows, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (isMounted) {
        const hasAdminRole = !roleError && !!roleRows;
        setIsAuthenticated(hasAdminRole);
        setUser({
          id: authData.user.id,
          name: authData.user.email ?? "Admin",
          email: authData.user.email ?? undefined,
        });
        setLoading(false);
      }
    };

    void loadAdminAuth();

    return () => {
      isMounted = false;
    };
  }, [portal]);

  return {
    isAuthenticated,
    loading,
    user,
  };
}
