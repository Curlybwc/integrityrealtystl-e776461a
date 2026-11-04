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
  ClaimConflictError,
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

interface StoreRow {
  id: string;
  provider: string;
  provider_document_id: string | null;
  status: string;
  created_at: string;
  signers: number;
}

/**
 * In-memory model of the database semantics the fix relies on:
 *  - claimRequest enforces the partial unique index (one open request
 *    per owner) by throwing ClaimConflictError;
 *  - completeSend models complete_baa_send's single transaction: it
 *    either applies request+signer+profile together or (when
 *    failComplete is set) applies NOTHING, like a rolled-back txn.
 */
function makeStore() {
  const store = {
    rows: [] as StoreRow[],
    profileMarked: [] as { provider: string; signingRequestId: string }[],
    sends: 0,
    failComplete: false,
    providerFails: false,
  };
  let seq = 0;
  const provider: SigningProvider = {
    name: "boldsign",
    sendFromTemplate: async () => {
      store.sends += 1;
      await new Promise((r) => setTimeout(r, 5));
      if (store.providerFails) throw new Error("BoldSign is down");
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
    now: () => new Date(),
    loadProfile: async () => PROFILE,
    findOpenRequest: async () =>
      store.rows.find((r) => ["prepared", "sent", "partially_signed"].includes(r.status)) ?? null,
    claimRequest: async () => {
      if (store.rows.some((r) => ["prepared", "sent", "partially_signed"].includes(r.status))) {
        throw new ClaimConflictError();
      }
      seq += 1;
      const row: StoreRow = {
        id: `req-${seq}`, provider: "boldsign", provider_document_id: null,
        status: "prepared", created_at: new Date().toISOString(), signers: 0,
      };
      store.rows.push(row);
      return { id: row.id };
    },
    attachProviderDocument: async (requestId, providerDocumentId) => {
      const row = store.rows.find((r) => r.id === requestId)!;
      row.provider_document_id = providerDocumentId;
    },
    completeSend: async (args) => {
      if (store.failComplete) {
        // e.g. the signer INSERT fails inside complete_baa_send: the
        // whole transaction rolls back — no request flip, no signer,
        // no profile change.
        throw new Error("insert into signature_request_signers failed");
      }
      const row = store.rows.find((r) => r.id === args.requestId)!;
      row.status = "sent";
      row.signers += 1;
      store.profileMarked.push({ provider: args.provider, signingRequestId: args.requestId });
    },
    releaseClaim: async (requestId) => {
      store.rows = store.rows.filter((r) => !(r.id === requestId && r.status === "prepared"));
    },
  };
  return { store, deps };
}

describe("BAA send orchestration (the scaffold's preserved contract)", () => {
  it("refuses an already-signed profile without claiming or sending", async () => {
    const { store, deps } = makeStore();
    deps.loadProfile = async () => ({ ...PROFILE, baa_status: "signed" });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "admin-1" });
    expect(result.outcome).toBe("already_signed");
    expect(store.sends).toBe(0);
    expect(store.rows).toEqual([]);
  });

  it("returns the open request on resend instead of sending a duplicate", async () => {
    const { store, deps } = makeStore();
    store.rows.push({
      id: "req-open", provider: "boldsign", provider_document_id: "doc-9",
      status: "sent", created_at: new Date().toISOString(), signers: 1,
    });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result).toEqual({ outcome: "already_sent", requestId: "req-open", providerDocumentId: "doc-9" });
    expect(store.sends).toBe(0);
  });

  it("answers not_configured with zero writes when the provider is absent", async () => {
    const { store, deps } = makeStore();
    deps.provider = null;
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result.outcome).toBe("not_configured");
    expect(store.rows).toEqual([]);
    expect(store.profileMarked).toEqual([]);
  });

  it("releases the claim and mutates nothing durable when the provider fails", async () => {
    const { store, deps } = makeStore();
    store.providerFails = true;
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result).toEqual({ outcome: "provider_failed", detail: "BoldSign is down" });
    expect(store.rows).toEqual([]);
    expect(store.profileMarked).toEqual([]);
  });

  it("on success: one claim, one send, one atomic completion", async () => {
    const { store, deps } = makeStore();
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "admin-1" });
    expect(result).toEqual({ outcome: "sent", requestId: "req-1", providerDocumentId: "doc-42" });
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ status: "sent", provider_document_id: "doc-42", signers: 1 });
    expect(store.profileMarked).toEqual([{ provider: "boldsign", signingRequestId: "req-1" }]);
  });
});

describe("gate P1 attack shapes", () => {
  it("concurrent double-send: exactly one provider send, one request row", async () => {
    const { store, deps } = makeStore();
    const [a, b] = await Promise.all([
      sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" }),
      sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" }),
    ]);
    expect(store.sends).toBe(1);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0].status).toBe("sent");
    expect(store.rows[0].signers).toBe(1);
    expect(store.profileMarked).toHaveLength(1);
    expect([a.outcome, b.outcome].sort()).toEqual(["already_sent", "sent"]);
  });

  it("forced completion failure leaves NO partial state, and a retry adopts the same provider document", async () => {
    const { store, deps } = makeStore();
    store.failComplete = true; // the signer insert blows up inside the txn
    const first = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(first.outcome).toBe("record_failed");
    // No partial state: profile unmarked, request NOT flipped to sent,
    // zero signers — only the claim + its provider document id remain.
    expect(store.profileMarked).toEqual([]);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({ status: "prepared", provider_document_id: "doc-42", signers: 0 });

    store.failComplete = false;
    const retry = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(retry).toEqual({ outcome: "sent", requestId: "req-1", providerDocumentId: "doc-42" });
    expect(store.sends).toBe(1); // adopted — no duplicate provider send
    expect(store.rows[0]).toMatchObject({ status: "sent", signers: 1 });
    expect(store.profileMarked).toHaveLength(1);
  });

  it("releases a stale prepared claim with no provider document and sends fresh", async () => {
    const { store, deps } = makeStore();
    store.rows.push({
      id: "req-stale", provider: "boldsign", provider_document_id: null,
      status: "prepared",
      created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(), signers: 0,
    });
    const result = await sendBaa(deps, { targetUserId: "user-1", callerId: "user-1" });
    expect(result.outcome).toBe("sent");
    expect(store.sends).toBe(1);
    expect(store.rows.map((r) => r.id)).toEqual(["req-1"]);
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

describe("atomicity fix migration (static checks)", () => {
  const fix = readFileSync(
    path.resolve(__dirname, "../../supabase/migrations/20261104100000_0706_signing_atomicity.sql"),
    "utf8",
  );

  it("serializes the idempotency check with a partial unique index over open states", () => {
    expect(fix).toContain("CREATE UNIQUE INDEX IF NOT EXISTS signature_requests_one_open_per_owner_kind");
    expect(fix).toMatch(/\(owner_id, kind\)\s+WHERE status IN \('prepared', 'sent', 'partially_signed'\)/);
  });

  it("completes a send in one function touching request, signers, and profile", () => {
    expect(fix).toContain("CREATE OR REPLACE FUNCTION public.complete_baa_send(");
    expect(fix).toContain("UPDATE public.signature_requests");
    expect(fix).toContain("INSERT INTO public.signature_request_signers");
    expect(fix).toContain("UPDATE public.profiles");
  });

  it("restricts the completion function to service_role", () => {
    expect(fix).toMatch(/REVOKE ALL ON FUNCTION public\.complete_baa_send\([^)]*\)\s+FROM PUBLIC, anon, authenticated/);
    expect(fix).toMatch(/GRANT EXECUTE ON FUNCTION public\.complete_baa_send\([^)]*\)\s+TO service_role/);
  });
});
