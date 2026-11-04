// BAA send orchestration (07.06 step 5 generalization, with 07.01 §23
// step 8). Encodes the contract the dotloop-send-baa scaffold preserved,
// hardened by the PR #36 gate fix round:
//
//   - already signed/verified  -> refuse (already_signed)
//   - an open sent request     -> return it (already_sent), no new send
//   - provider not configured  -> not_configured, zero writes
//   - provider failure         -> provider_failed, claim released, so the
//                                 profile AND the request table stay
//                                 untouched (no mutation on provider error)
//   - success                  -> claim -> send -> atomic completion
//
// Idempotency is serialized BEFORE the send (gate P1): a 'prepared'
// claim row reserves the (owner, kind) slot against a partial unique
// index, so two concurrent sends cannot both reach the provider — the
// loser's claim insert fails unique and it observes the winner's open
// request instead. Completion is ONE atomic database operation
// (complete_baa_send: request + signer + profile in a single
// transaction — gate P1), so no partial state can be left behind. If
// completion fails after a successful provider send, the provider
// document id is attached to the claim first (single atomic update),
// the outcome is record_failed, and a later call ADOPTS that document
// and retries completion instead of sending a duplicate.

import {
  ProviderNotConfiguredError,
  type SigningProvider,
} from "./provider.ts";

export interface BaaProfile {
  id: string;
  email: string;
  full_name: string | null;
  baa_status: string;
}

export interface OpenRequest {
  id: string;
  provider: string;
  provider_document_id: string | null;
  status: string;
  created_at: string;
}

/** Thrown by claimRequest when the (owner, kind) slot is already taken. */
export class ClaimConflictError extends Error {
  constructor() {
    super("An open signature request already exists for this owner and kind");
    this.name = "ClaimConflictError";
  }
}

export interface BaaSendDeps {
  provider: SigningProvider | null;
  templateId: string | null;
  loadProfile(targetUserId: string): Promise<BaaProfile | null>;
  findOpenRequest(ownerId: string): Promise<OpenRequest | null>;
  /** Insert the 'prepared' claim. Throws ClaimConflictError on the unique index. */
  claimRequest(args: {
    ownerId: string;
    provider: string;
    templateRef: string;
    sentBy: string;
  }): Promise<{ id: string }>;
  /** Single-statement update attaching the provider document id to a claim. */
  attachProviderDocument(requestId: string, providerDocumentId: string): Promise<void>;
  /** The atomic completion (complete_baa_send): request + signer + profile. */
  completeSend(args: {
    requestId: string;
    provider: string;
    providerDocumentId: string;
    signerName: string;
    signerEmail: string;
    sentAt: string;
  }): Promise<void>;
  /** Delete a 'prepared' claim (provider failure / stale claim recovery). */
  releaseClaim(requestId: string): Promise<void>;
  now(): Date;
}

export type BaaSendResult =
  | { outcome: "sent"; requestId: string; providerDocumentId: string }
  | { outcome: "already_sent"; requestId: string; providerDocumentId: string | null }
  | { outcome: "already_signed"; status: string }
  | { outcome: "profile_not_found" }
  | { outcome: "not_configured" }
  | { outcome: "provider_failed"; detail: string }
  | { outcome: "record_failed"; requestId: string; providerDocumentId: string; detail: string };

/** A 'prepared' claim with no provider document older than this is dead. */
const STALE_CLAIM_MS = 10 * 60 * 1000;

export async function sendBaa(
  deps: BaaSendDeps,
  args: { targetUserId: string; callerId: string },
): Promise<BaaSendResult> {
  const profile = await deps.loadProfile(args.targetUserId);
  if (!profile) return { outcome: "profile_not_found" };

  if (profile.baa_status === "signed" || profile.baa_status === "verified") {
    return { outcome: "already_signed", status: profile.baa_status };
  }

  const signerName = profile.full_name || profile.email;

  // Resolve any existing open request before claiming.
  const open = await deps.findOpenRequest(profile.id);
  if (open) {
    if (open.status === "sent" || open.status === "partially_signed") {
      return {
        outcome: "already_sent",
        requestId: open.id,
        providerDocumentId: open.provider_document_id,
      };
    }
    if (open.status === "prepared") {
      if (open.provider_document_id) {
        // A previous send reached the provider but its completion did
        // not land: adopt the document and retry the atomic completion
        // instead of sending a duplicate.
        return completeClaim(deps, open.id, open.provider, open.provider_document_id, signerName, profile.email);
      }
      const ageMs = deps.now().getTime() - new Date(open.created_at).getTime();
      if (ageMs > STALE_CLAIM_MS) {
        // The claiming call died before the provider answered; free the
        // slot and fall through to a fresh send.
        await deps.releaseClaim(open.id);
      } else {
        // A send is in flight right now — idempotent answer.
        return { outcome: "already_sent", requestId: open.id, providerDocumentId: null };
      }
    }
  }

  if (!deps.provider || !deps.templateId) return { outcome: "not_configured" };

  // Claim BEFORE sending: the partial unique index serializes here.
  let requestId: string;
  try {
    const claim = await deps.claimRequest({
      ownerId: profile.id,
      provider: deps.provider.name,
      templateRef: deps.templateId,
      sentBy: args.callerId,
    });
    requestId = claim.id;
  } catch (err) {
    if (err instanceof ClaimConflictError) {
      // Lost a concurrent race: the winner's open request is the answer.
      const winner = await deps.findOpenRequest(profile.id);
      if (winner) {
        return {
          outcome: "already_sent",
          requestId: winner.id,
          providerDocumentId: winner.provider_document_id,
        };
      }
      return { outcome: "provider_failed", detail: "Send raced and no open request was found" };
    }
    throw err;
  }

  let providerDocumentId: string;
  try {
    const sent = await deps.provider.sendFromTemplate({
      templateId: deps.templateId,
      title: "Buyer Agency Agreement",
      message: "Please review and sign your Buyer Agency Agreement with Integrity Realty STL.",
      signers: [{
        name: signerName,
        email: profile.email,
        role: "Buyer",
        signerOrder: 1,
      }],
    });
    providerDocumentId = sent.providerDocumentId;
  } catch (err) {
    // No durable trace of a failed send: release the claim, exactly as
    // the scaffold left the profile untouched on provider failure.
    await deps.releaseClaim(requestId);
    if (err instanceof ProviderNotConfiguredError) return { outcome: "not_configured" };
    return {
      outcome: "provider_failed",
      detail: err instanceof Error ? err.message : "Unknown provider error",
    };
  }

  // Record the provider document on the claim with a single atomic
  // update BEFORE the completion transaction, so a completion failure
  // leaves an adoptable claim — never an untracked provider document.
  try {
    await deps.attachProviderDocument(requestId, providerDocumentId);
  } catch (err) {
    return {
      outcome: "record_failed",
      requestId,
      providerDocumentId,
      detail: err instanceof Error ? err.message : "Could not attach the provider document",
    };
  }

  return completeClaim(deps, requestId, deps.provider.name, providerDocumentId, signerName, profile.email);
}

async function completeClaim(
  deps: BaaSendDeps,
  requestId: string,
  providerName: string,
  providerDocumentId: string,
  signerName: string,
  signerEmail: string,
): Promise<BaaSendResult> {
  try {
    await deps.completeSend({
      requestId,
      provider: providerName,
      providerDocumentId,
      signerName,
      signerEmail,
      sentAt: deps.now().toISOString(),
    });
  } catch (err) {
    return {
      outcome: "record_failed",
      requestId,
      providerDocumentId,
      detail: err instanceof Error ? err.message : "Completion failed",
    };
  }
  return { outcome: "sent", requestId, providerDocumentId };
}
