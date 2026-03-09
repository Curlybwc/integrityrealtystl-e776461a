import { useCallback } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";

interface UseHasRoleResult {
  hasRole: (role: string) => boolean;
}

export function useHasRole(): UseHasRoleResult {
  const { roles, loading } = useUserRoles();

  const hasRole = useCallback(
    (role: string) => {
      if (loading) return false;
      return roles.includes(role);
    },
    [loading, roles]
  );

  return { hasRole };
}
