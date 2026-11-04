// Normalized signing state (07.06 DC-R08): provider statuses map back to
// one Integrity-owned state model. Unknown provider values throw — a
// status we cannot classify must surface, never silently map (AM §43).

import type { NormalizedRequestStatus, NormalizedSignerStatus } from "./provider.ts";

const BOLDSIGN_DOCUMENT_STATUS: Record<string, NormalizedRequestStatus> = {
  Draft: "prepared",
  InProgress: "sent",
  PartiallySigned: "partially_signed",
  Completed: "completed",
  Declined: "declined",
  Revoked: "revoked",
  Expired: "expired",
};

export function mapBoldSignDocumentStatus(providerStatus: string): NormalizedRequestStatus {
  const mapped = BOLDSIGN_DOCUMENT_STATUS[providerStatus];
  if (!mapped) throw new Error(`Unknown BoldSign document status: ${providerStatus}`);
  return mapped;
}

const BOLDSIGN_SIGNER_STATUS: Record<string, NormalizedSignerStatus> = {
  NotCompleted: "pending",
  Pending: "pending",
  Viewed: "pending",
  Completed: "signed",
  Signed: "signed",
  Declined: "declined",
};

export function mapBoldSignSignerStatus(providerStatus: string): NormalizedSignerStatus {
  const mapped = BOLDSIGN_SIGNER_STATUS[providerStatus];
  if (!mapped) throw new Error(`Unknown BoldSign signer status: ${providerStatus}`);
  return mapped;
}

/** The profile-level BAA states (public.baa_status enum, 07.01-owned). */
export type BaaStatus = "not_required" | "not_sent" | "sent" | "signed" | "verified";

/**
 * Bridge from normalized request state to the BAA profile state.
 * 'verified' is deliberately unreachable here: verification is a staff
 * judgment (admin-update-baa), never a provider event.
 */
export function baaStatusForRequestStatus(status: NormalizedRequestStatus): BaaStatus | null {
  switch (status) {
    case "sent":
    case "partially_signed":
      return "sent";
    case "completed":
      return "signed";
    default:
      return null;
  }
}
