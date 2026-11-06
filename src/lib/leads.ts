import { supabase } from "@/integrations/supabase/client";

// public_leads lands via migration 20261106120000; the generated client
// types predate it, so inserts go through a narrow local interface (the
// same pattern src/lib/documents.ts uses for its tables).
type LeadInsertClient = {
  from(table: string): {
    insert(values: Record<string, unknown>): Promise<{
      error: { message: string } | null;
    }>;
  };
};

const client = supabase as unknown as LeadInsertClient;

export type LeadFormKind =
  | "buyer"
  | "investor"
  | "seller"
  | "sellfast"
  | "wholesaler"
  | "network_partner"
  | "contact";

/**
 * Records a public website form submission in public_leads.
 * Returns { error } — callers must only show a success state when
 * error is null. Before this helper existed, the public forms faked
 * success with a timer and discarded the submission.
 */
export async function submitLead(
  formKind: LeadFormKind,
  payload: Record<string, unknown>,
): Promise<{ error: string | null }> {
  const { error } = await client.from("public_leads").insert({
    form_kind: formKind,
    payload,
    page_path: typeof window !== "undefined" ? window.location.pathname : null,
  });
  return { error: error ? error.message : null };
}
