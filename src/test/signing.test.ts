import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createBoldSignProvider, type FetchFn } from "../../supabase/functions/_shared/signing/boldsign";
import { ProviderError } from "../../supabase/functions/_shared/signing/provider";
import {
  baaStatusForRequestStatus,
  mapBoldSignDocumentStatus,
  mapBoldSignSignerStatus,
} from "../../supabase/functions/_shared/signing/state";
import {
  sendBaa,
  type BaaProfile,
  type BaaSendDeps,
} from "../../supabase/functions/_shared/signing/baa-send";
import type { SigningProvider } from "../../supabase/functions/_shared/signing/provider";

describe("normalized state mapping", () => {
  it("maps every BoldSign document status to the normalized model", () => {
    expect(mapBoldSignDocumentStatus("Draft")).toBe("prepared");
    expect(mapBoldSignDocumentStatus("InProgress")).toBe("sent");
    expect(mapBoldSignDocumentStatus("PartiallySigned")).toBe("partially_signed");
    expect(mapBoldSignDocumentStatus("Completed")).toBe("completed");
    expect(mapBoldSignDocumentStatus("Declined")).toBe("declined");
    expect(mapBoldSignDocumentStatus("Revoked")).toBe("revoked");
    expect(mapBoldSignDocumentStatus("Expired")).toBe("expired");
  });

  it("throws on an unknown provider status instead of guessing", () => {
    expect(() => mapBoldSignDocumentStatus("SomethingNew")).toThrow(/Unknown BoldSign/);
    expect(() => mapBoldSignSignerStatus("SomethingNew")).toThrow(/Unknown BoldSign/);
  });

  it("maps signer statuses", () => {
    expect(mapBoldSignSignerStatus("NotCompleted")).toBe("pending");
    expect(mapBoldSignSignerStatus("Completed")).toBe("signed");
    expect(mapBoldSignSignerStatus("Declined")).toBe("declined");
  });

  it("bridges to BAA profile state — and never to verified", () => {
    expect(baaStatusForRequestStatus("sent")).toBe("sent");
    expect(baaStatusForRequestStatus("partially_signed")).toBe("sent");
    expect(baaStatusForRequestStatus("completed")).toBe("signed");
    expect(baaStatusForRequestStatus("declined")).toBeNull();
    expect(baaStatusForRequestStatus("revoked")).toBeNull();
    for (const s of ["prepared", "sent", "partially_signed", "completed", "declined", "revoked", "expired"] as const) {
      expect(baaStatusForRequestStatus(s)).not.toBe("verified");
    }
  });
});

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BoldSign adapter (sandbox-verified shapes)", () => {
  it("sends from a template with the API key header and role payload", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn: FetchFn = async (url, init) => {
      calls.push({ url, init });
      return jsonResponse(201, { documentId: "doc-123" });
    };
    const provider = createBoldSignProvider({ apiKey: "test-key" }, fetchFn);
    const result = await provider.sendFromTemplate({
      templateId: "tpl-9",
      title: "Buyer Agency Agreement",
      signers: [{ name: "Test Buyer", email: "buyer@example.com", signerOrder: 1 }],
    });
    expect(result.providerDocumentId).toBe("doc-123");
    expect(calls[0].url).toBe("https://api.boldsign.com/v1/template/send?templateId=tpl-9");
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>)["X-API-KEY"]).toBe("test-key");
    const body = JSON.parse(calls[0].init.body as string);
    expect(body.roles).toEqual([{ roleIndex: 1, signerName: "Test Buyer", signerEmail: "buyer@example.com" }]);
  });

  it("revokes via POST with the documentId in the query and a message body", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn: FetchFn = async (url, init) => {
      calls.push({ url, init });
      return new Response(null, { status: 204 });
    };
    const provider = createBoldSignProvider({ apiKey: "k" }, fetchFn);
    await provider.revoke("doc-1", "Wrong terms");
    expect(calls[0].url).toBe("https://api.boldsign.com/v1/document/revoke?documentId=doc-1");
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ message: "Wrong terms" });
  });

  it("surfaces the provider's refusal message (post-completion revoke)", async () => {
    const fetchFn: FetchFn = async () =>
      jsonResponse(400, { error: "This document has already been completed." });
    const provider = createBoldSignProvider({ apiKey: "k" }, fetchFn);
    await expect(provider.revoke("doc-1", "x")).rejects.toMatchObject({
      name: "ProviderError",
      message: "This document has already been completed.",
      providerStatus: 400,
    } satisfies Partial<ProviderError>);
  });

  it("reads document status through the properties endpoint and maps it", async () => {
    const fetchFn: FetchFn = async () =>
      jsonResponse(200, {
        status: "InProgress",
        signerDetails: [{ signerEmail: "buyer@example.com", status: "NotCompleted" }],
      });
    const provider = createBoldSignProvider({ apiKey: "k" }, fetchFn);
    const doc = await provider.getDocumentStatus("doc-7");
    expect(doc.status).toBe("sent");
    expect(doc.signers).toEqual([{ email: "buyer@example.com", status: "pending" }]);
  });

  it("refuses to call out when no API key is configured", async () => {
    const fetchFn: FetchFn = vi.fn(async () => jsonResponse(200, {}));
    const provider = createBoldSignProvider({ apiKey: null }, fetchFn);
    await expect(provider.getDocumentStatus("doc-1")).rejects.toThrow(/not set/);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

const PROFILE: BaaProfile = {
  id: "user-1",
  email: "buyer@example.com",
  full_name: "Test Buyer",
  baa_status: "not_sent",
};

function makeDeps(overrides: Partial<BaaSendDeps> = {}) {
  const calls = { created: [] as unknown[], marked: [] as unknown[], sends: 0 };
  const provider: SigningProvider = {
    name: "boldsign",
    sendFromTemplate: async () => {
      calls.sends += 1;
      return { providerDocumentId: "doc-42" };
    },
    getDocumentStatus: async () => ({ providerDocumentId: "x", status: "sent", signers: [] }),
    remind: async () => {},
    revoke: async () => {},
    downloadExecuted: async () => new ArrayBuffer(0),
    downloadAuditLog: async () => new ArrayBuffer(0),
  };
  const deps: BaaSendDeps = {
    provider,
    templateId: "tpl-1",
    loadProfile: async () => PROFILE,
    findOpenRequest: async () => null,
    createRequest: async (args) => {
      calls.created.push(args);
      return { id: "req-1" };
    },
    markProfileSent: async (args) => {
      calls.marked.push(args);
    },
    ...overrides,
  };
  return { deps, calls };
}

describe("BAA send orchestration (the scaffold's preserved contract)", () => {
  it("refuses an already-signed profile without touching the provider", async () => {
    const { deps, calls } = makeDeps({
      loadProfile: async () => ({ ...PROFILE, baa_status: "signed" }),
    });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "admin-1" });
    expect(result.outcome).toBe("already_signed");
    expect(calls.sends).toBe(0);
    expect(calls.created).toEqual([]);
    expect(calls.marked).toEqual([]);
  });

  it("returns the open request on resend instead of sending a duplicate", async () => {
    const { deps, calls } = makeDeps({
      findOpenRequest: async () => ({
        id: "req-open", provider: "boldsign", provider_document_id: "doc-9", status: "sent",
      }),
    });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result).toEqual({ outcome: "already_sent", requestId: "req-open", providerDocumentId: "doc-9" });
    expect(calls.sends).toBe(0);
  });

  it("answers not_configured with zero writes when the provider is absent", async () => {
    const { deps, calls } = makeDeps({ provider: null });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result.outcome).toBe("not_configured");
    expect(calls.created).toEqual([]);
    expect(calls.marked).toEqual([]);
  });

  it("never mutates anything when the provider call fails", async () => {
    const failing: SigningProvider = {
      name: "boldsign",
      sendFromTemplate: async () => {
        throw new Error("BoldSign is down");
      },
      getDocumentStatus: async () => { throw new Error("x"); },
      remind: async () => {},
      revoke: async () => {},
      downloadExecuted: async () => new ArrayBuffer(0),
      downloadAuditLog: async () => new ArrayBuffer(0),
    };
    const { deps, calls } = makeDeps({ provider: failing });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result).toEqual({ outcome: "provider_failed", detail: "BoldSign is down" });
    expect(calls.created).toEqual([]);
    expect(calls.marked).toEqual([]);
  });

  it("on success creates the request record, then marks the profile sent via the new columns", async () => {
    const { deps, calls } = makeDeps();
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "admin-1" });
    expect(result).toEqual({ outcome: "sent", requestId: "req-1", providerDocumentId: "doc-42" });
    expect(calls.created).toHaveLength(1);
    expect(calls.marked).toEqual([
      expect.objectContaining({ profileId: "user-1", provider: "boldsign", signingRequestId: "req-1" }),
    ]);
  });
});

describe("signing migration (static checks)", () => {
  const sql = readFileSync(
    path.resolve(__dirname, "../../supabase/migrations/20261104090000_0706_signing_state.sql"),
    "utf8",
  );

  it("enables RLS and revokes before granting on all three signing tables", () => {
    for (const table of ["signature_requests", "signature_request_signers", "signature_events"]) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      const revoke = sql.indexOf(`REVOKE ALL ON public.${table} FROM anon, authenticated`);
      const grant = sql.indexOf(`public.${table} TO authenticated`);
      expect(revoke).toBeGreaterThan(-1);
      expect(grant).toBeGreaterThan(revoke);
    }
  });

  it("gives authenticated no write grant on signing tables (writes are service-role only)", () => {
    expect(sql).not.toMatch(/GRANT (INSERT|UPDATE|DELETE)[^;]*TO authenticated/);
    expect(sql).toContain("GRANT ALL ON public.signature_requests TO service_role");
  });

  it("adds provider columns without altering the legacy Dotloop columns", () => {
    expect(sql).toContain("baa_provider");
    expect(sql).toContain("baa_signing_request_id");
    expect(sql).not.toMatch(/ALTER COLUMN baa_dotloop|DROP COLUMN baa_dotloop|UPDATE public\.profiles[^;]*baa_dotloop/);
  });
});
