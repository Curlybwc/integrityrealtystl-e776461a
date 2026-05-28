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

// Mock auth is opt-in. Only enabled when explicitly set to "true".
const mockAuthEnabled = import.meta.env.VITE_ENABLE_MOCK_AUTH === "true";

// Roles that grant access to each portal. Admin can access every portal.
const PORTAL_REQUIRED_ROLES: Record<PortalType, string[]> = {
  investor: ["investor", "admin"],
  wholesaler: ["wholesaler", "admin"],
  partner: ["partner", "admin"],
  admin: ["admin"],
};

export function usePortalAuth(portal: PortalType) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PortalUser>(MOCK_USERS[portal]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (!authError && authData.user) {
        const allowedRoles = PORTAL_REQUIRED_ROLES[portal];
        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authData.user.id)
          .in("role", allowedRoles as any);

        const hasAccess = !roleError && Array.isArray(roleRows) && roleRows.length > 0;

        if (isMounted) {
          setIsAuthenticated(hasAccess);
          setUser({
            id: authData.user.id,
            name: authData.user.email ?? MOCK_USERS[portal].name,
            email: authData.user.email ?? undefined,
          });
          setLoading(false);
        }
        return;
      }

      // Mock auth fallback — opt-in via VITE_ENABLE_MOCK_AUTH=true or demo_mode session flag.
      // Never for admin.
      const demoMode = typeof window !== "undefined" && sessionStorage.getItem("demo_mode") === "true";
      if (portal !== "admin" && (mockAuthEnabled || demoMode)) {
        if (isMounted) {
          setIsAuthenticated(true);
          setUser(MOCK_USERS[portal]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    void checkAuth();

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
