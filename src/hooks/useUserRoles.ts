import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseUserRolesResult {
  roles: string[];
  loading: boolean;
}

export function useUserRoles(): UseUserRolesResult {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (isMounted) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      if (error || !data) {
        if (isMounted) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setRoles(data.map((row) => row.role));
        setLoading(false);
      }
    };

    void loadRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  return { roles, loading };
}
