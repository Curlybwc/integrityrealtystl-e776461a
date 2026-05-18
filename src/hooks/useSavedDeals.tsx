import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SavedDeal, SavedDealSnapshot } from "@/lib/savedDeals";

interface State {
  byKey: Map<string, SavedDeal>;
  byId: Map<string, SavedDeal>;
  list: SavedDeal[];
  loading: boolean;
  userId: string | null;
  error: string | null;
}

const initial: State = { byKey: new Map(), byId: new Map(), list: [], loading: true, userId: null, error: null };

export function useSavedDeals() {
  const [state, setState] = useState<State>(initial);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id ?? null;
    if (!uid) {
      setState({ ...initial, loading: false });
      return;
    }
    const { data, error } = await supabase
      .from("saved_deals")
      .select("*")
      .eq("user_id", uid)
      .order("saved_at", { ascending: false });
    if (error) {
      setState({ ...initial, userId: uid, loading: false, error: error.message });
      return;
    }
    const list = (data ?? []) as unknown as SavedDeal[];
    const byKey = new Map(list.map((r) => [r.property_key, r] as const));
    const byId = new Map(list.map((r) => [r.id, r] as const));
    setState({ byKey, byId, list, loading: false, userId: uid, error: null });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isSaved = useCallback((propertyKey: string) => state.byKey.has(propertyKey), [state.byKey]);
  const getByKey = useCallback((propertyKey: string) => state.byKey.get(propertyKey) ?? null, [state.byKey]);
  const getById = useCallback((id: string) => state.byId.get(id) ?? null, [state.byId]);

  const saveDeal = useCallback(
    async (snapshot: SavedDealSnapshot): Promise<SavedDeal | null> => {
      if (!state.userId) throw new Error("Sign in to save deals.");
      const payload = { ...snapshot, user_id: state.userId };
      const { data, error } = await supabase
        .from("saved_deals")
        .insert(payload as never)
        .select()
        .single();
      if (error) throw error;
      await load();
      return data as unknown as SavedDeal;
    },
    [state.userId, load],
  );

  const updateSaved = useCallback(
    async (id: string, snapshot: SavedDealSnapshot): Promise<SavedDeal | null> => {
      const { data, error } = await supabase
        .from("saved_deals")
        .update(snapshot as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await load();
      return data as unknown as SavedDeal;
    },
    [load],
  );

  const unsaveDeal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("saved_deals").delete().eq("id", id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return useMemo(
    () => ({
      list: state.list,
      loading: state.loading,
      error: state.error,
      userId: state.userId,
      canSave: !!state.userId,
      isSaved,
      getByKey,
      getById,
      saveDeal,
      updateSaved,
      unsaveDeal,
      refresh: load,
    }),
    [state, isSaved, getByKey, getById, saveDeal, updateSaved, unsaveDeal, load],
  );
}
