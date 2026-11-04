// Signing provider abstraction (07.06 DC-R10/DC-R11).
// One generic signing service supports BAA and (later) transaction
// documents — never provider code duplicated per form (canon §35).
// Implementations: boldsign.ts (adopted provider), plus test fakes.

export type NormalizedRequestStatus =
  | "prepared"
  | "sent"
  | "partially_signed"
  | "completed"
  | "declined"
  | "revoked"
  | "expired";

export type NormalizedSignerStatus = "pending" | "signed" | "declined";

export interface SignerInput {
  name: string;
  email: string;
  role?: string;
  signerOrder?: number;
}

export interface SendFromTemplateArgs {
  templateId: string;
  title: string;
  message?: string;
  signers: SignerInput[];
}

export interface ProviderDocument {
  providerDocumentId: string;
  status: NormalizedRequestStatus;
  signers: { email: string; status: NormalizedSignerStatus }[];
}

export class ProviderError extends Error {
  readonly providerStatus: number | null;
  constructor(message: string, providerStatus: number | null = null) {
    super(message);
    this.name = "ProviderError";
    this.providerStatus = providerStatus;
  }
}

export class ProviderNotConfiguredError extends Error {
  constructor(message = "Signing provider is not configured") {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}

export interface SigningProvider {
  readonly name: string;
  sendFromTemplate(args: SendFromTemplateArgs): Promise<{ providerDocumentId: string }>;
  getDocumentStatus(providerDocumentId: string): Promise<ProviderDocument>;
  remind(providerDocumentId: string, signerEmail: string): Promise<void>;
  revoke(providerDocumentId: string, reason: string): Promise<void>;
  downloadExecuted(providerDocumentId: string): Promise<ArrayBuffer>;
  downloadAuditLog(providerDocumentId: string): Promise<ArrayBuffer>;
}
