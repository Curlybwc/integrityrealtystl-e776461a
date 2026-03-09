import { useEffect, useState } from "react";

export interface ActiveImpersonation {
  sessionId: string;
  adminUserId: string;
  adminEmail: string;
  targetUserId: string;
  targetEmail: string;
  reason: string;
  startedAt: string;
}

const STORAGE_KEY = "active_admin_impersonation";

export function loadActiveImpersonation(): ActiveImpersonation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveImpersonation;
  } catch {
    return null;
  }
}

export function saveActiveImpersonation(payload: ActiveImpersonation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("impersonation-changed"));
}

export function clearActiveImpersonation() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("impersonation-changed"));
}

export function useImpersonation() {
  const [active, setActive] = useState<ActiveImpersonation | null>(() => loadActiveImpersonation());

  useEffect(() => {
    const reload = () => setActive(loadActiveImpersonation());
    window.addEventListener("storage", reload);
    window.addEventListener("impersonation-changed", reload);

    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("impersonation-changed", reload);
    };
  }, []);

  return { active };
}
