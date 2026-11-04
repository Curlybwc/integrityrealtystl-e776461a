// BoldSign adapter — the adopted signing provider (test report:
// ezzie-build-plan/builds/integrity-lane/BOLDSIGN-TEST-REPORT-2026-11-03.md).
// Every request shape here was proven against the sandbox in that test:
//   - template send: POST /v1/template/send?templateId= (JSON roles)
//   - status:        GET  /v1/document/properties?documentId=
//   - remind:        POST /v1/document/remind?documentId=
//   - revoke:        POST /v1/document/revoke?documentId=  {"message": ...}
//   - downloads:     GET  /v1/document/download | /downloadAuditLog
// Sandbox and production share the host; the KEY decides the mode.

import {
  ProviderError,
  ProviderNotConfiguredError,
  type ProviderDocument,
  type SendFromTemplateArgs,
  type SigningProvider,
} from "./provider.ts";
import { mapBoldSignDocumentStatus, mapBoldSignSignerStatus } from "./state.ts";

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

export interface BoldSignConfig {
  apiKey: string | null;
  baseUrl?: string;
}

interface BoldSignProperties {
  status?: string;
  signerDetails?: { signerEmail?: string; status?: string }[];
}

export function createBoldSignProvider(
  config: BoldSignConfig,
  fetchFn: FetchFn = (url, init) => fetch(url, init),
): SigningProvider {
  const base = config.baseUrl ?? "https://api.boldsign.com";

  function requireKey(): string {
    if (!config.apiKey) throw new ProviderNotConfiguredError("BoldSign API key is not set");
    return config.apiKey;
  }

  async function call(path: string, init: RequestInit = {}): Promise<Response> {
    const key = requireKey();
    const res = await fetchFn(`${base}${path}`, {
      ...init,
      headers: { "X-API-KEY": key, ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      let message = `BoldSign request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string; errors?: Record<string, string[]> };
        if (body.error) message = body.error;
        else if (body.errors) {
          const first = Object.values(body.errors).flat()[0];
          if (first) message = first;
        }
      } catch {
        // keep the generic message
      }
      throw new ProviderError(message, res.status);
    }
    return res;
  }

  return {
    name: "boldsign",

    async sendFromTemplate(args: SendFromTemplateArgs) {
      const res = await call(`/v1/template/send?templateId=${encodeURIComponent(args.templateId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          message: args.message ?? "",
          roles: args.signers.map((s, i) => ({
            roleIndex: s.signerOrder ?? i + 1,
            signerName: s.name,
            signerEmail: s.email,
          })),
        }),
      });
      const body = (await res.json()) as { documentId?: string };
      if (!body.documentId) throw new ProviderError("BoldSign send returned no documentId");
      return { providerDocumentId: body.documentId };
    },

    async getDocumentStatus(providerDocumentId: string): Promise<ProviderDocument> {
      const res = await call(
        `/v1/document/properties?documentId=${encodeURIComponent(providerDocumentId)}`,
      );
      const body = (await res.json()) as BoldSignProperties;
      if (!body.status) throw new ProviderError("BoldSign properties returned no status");
      return {
        providerDocumentId,
        status: mapBoldSignDocumentStatus(body.status),
        signers: (body.signerDetails ?? []).map((s) => ({
          email: s.signerEmail ?? "",
          status: mapBoldSignSignerStatus(s.status ?? "NotCompleted"),
        })),
      };
    },

    async remind(providerDocumentId: string, signerEmail: string) {
      await call(`/v1/document/remind?documentId=${encodeURIComponent(providerDocumentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerEmail }),
      });
    },

    async revoke(providerDocumentId: string, reason: string) {
      await call(`/v1/document/revoke?documentId=${encodeURIComponent(providerDocumentId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reason }),
      });
    },

    async downloadExecuted(providerDocumentId: string) {
      const res = await call(
        `/v1/document/download?documentId=${encodeURIComponent(providerDocumentId)}`,
      );
      return res.arrayBuffer();
    },

    async downloadAuditLog(providerDocumentId: string) {
      const res = await call(
        `/v1/document/downloadAuditLog?documentId=${encodeURIComponent(providerDocumentId)}`,
      );
      return res.arrayBuffer();
    },
  };
}
