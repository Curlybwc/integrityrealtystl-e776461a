// BAA send orchestration (07.06 step 5 generalization, with 07.01 §23
// step 8). This encodes the contract the dotloop-send-baa scaffold
// preserved, unchanged, over the provider abstraction:
//   - already signed/verified  -> refuse (already_signed)
//   - an open sent request     -> return it (already_sent), no new send
//   - provider not configured  -> not_configured, zero writes
//   - provider failure         -> provider_failed, zero writes
//     (the profile is NEVER mutated when the provider errors)
//   - success                  -> create the signature-request record,
//                                 then mark the profile sent
// The HTTP shell (signing-send-baa/index.ts) only translates results.

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
}

export interface BaaSendDeps {
  provider: SigningProvider | null;
  templateId: string | null;
  loadProfile(targetUserId: string): Promise<BaaProfile | null>;
  findOpenRequest(ownerId: string): Promise<OpenRequest | null>;
  createRequest(args: {
    ownerId: string;
    provider: string;
    providerDocumentId: string;
    templateRef: string;
    sentBy: string;
    signerName: string;
    signerEmail: string;
  }): Promise<{ id: string }>;
  markProfileSent(args: {
    profileId: string;
    provider: string;
    signingRequestId: string;
    sentAt: string;
  }): Promise<void>;
}

export type BaaSendResult =
  | { outcome: "sent"; requestId: string; providerDocumentId: string }
  | { outcome: "already_sent"; requestId: string; providerDocumentId: string | null }
  | { outcome: "already_signed"; status: string }
  | { outcome: "profile_not_found" }
  | { outcome: "not_configured" }
  | { outcome: "provider_failed"; detail: string };

export async function sendBaa(
  deps: BaaSendDeps,
  args: { targetUserId: string; callerId: string },
): Promise<BaaSendResult> {
  const profile = await deps.loadProfile(args.targetUserId);
  if (!profile) return { outcome: "profile_not_found" };

  if (profile.baa_status === "signed" || profile.baa_status === "verified") {
    return { outcome: "already_signed", status: profile.baa_status };
  }

  const open = await deps.findOpenRequest(profile.id);
  if (open && (open.status === "sent" || open.status === "partially_signed")) {
    return {
      outcome: "already_sent",
      requestId: open.id,
      providerDocumentId: open.provider_document_id,
    };
  }

  if (!deps.provider || !deps.templateId) return { outcome: "not_configured" };

  let providerDocumentId: string;
  try {
    const sent = await deps.provider.sendFromTemplate({
      templateId: deps.templateId,
      title: "Buyer Agency Agreement",
      message: "Please review and sign your Buyer Agency Agreement with Integrity Realty STL.",
      signers: [{
        name: profile.full_name || profile.email,
        email: profile.email,
        role: "Buyer",
        signerOrder: 1,
      }],
    });
    providerDocumentId = sent.providerDocumentId;
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) return { outcome: "not_configured" };
    return {
      outcome: "provider_failed",
      detail: err instanceof Error ? err.message : "Unknown provider error",
    };
  }

  const request = await deps.createRequest({
    ownerId: profile.id,
    provider: deps.provider.name,
    providerDocumentId,
    templateRef: deps.templateId,
    sentBy: args.callerId,
    signerName: profile.full_name || profile.email,
    signerEmail: profile.email,
  });

  await deps.markProfileSent({
    profileId: profile.id,
    provider: deps.provider.name,
    signingRequestId: request.id,
    sentAt: new Date().toISOString(),
  });

  return { outcome: "sent", requestId: request.id, providerDocumentId };
}
