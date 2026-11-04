import { File as NodeFile } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createDocumentsService,
  fingerprintFile,
  isExpired,
  storagePathFor,
  type CatalogDocument,
  type DocumentsClient,
} from "../lib/documents";

const OWNER = "11111111-1111-1111-1111-111111111111";
// SHA-256 of the ASCII bytes "abc" — a fixed, independently known value.
const ABC_SHA256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

function makeFile(content = "abc") {
  // Node's own File, not the jsdom global: this suite runs in a jsdom
  // environment whose Blob has no arrayBuffer(), so fingerprintFile fell
  // back to FileReader and got a jsdom-realm ArrayBuffer — which Node 20's
  // WebCrypto rejects in crypto.subtle.digest ("2nd argument is not
  // instance of ArrayBuffer"). A node:buffer File returns its bytes in
  // Node's realm, which SubtleCrypto accepts on every supported Node.
  // Production browser code is unaffected (same-realm Blob there).
  return new NodeFile([content], "proof-of-funds.pdf", { type: "application/pdf" }) as unknown as File;
}

interface FakeState {
  documents: CatalogDocument[];
  events: Record<string, unknown>[];
  uploads: { path: string }[];
  insertError: { code?: string; message: string } | null;
}

function fakeClient(state: FakeState): DocumentsClient {
  return {
    from(table: string) {
      if (table === "document_events") {
        return {
          select: () => { throw new Error("not used"); },
          insert: (values: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                state.events.push(values);
                return { data: { id: "evt" } as unknown as CatalogDocument, error: null };
              },
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: (_c1: string, v1: string) => ({
            eq: (_c2: string, v2: string) => ({
              maybeSingle: async () => ({
                data: state.documents.find((d) => d.owner_id === v1 && d.fingerprint === v2) ?? null,
                error: null,
              }),
            }),
            order: async () => ({ data: state.documents, error: null }),
          }),
        }),
        insert: (values: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (state.insertError) return { data: null as unknown as CatalogDocument, error: state.insertError };
              const doc = {
                id: "doc-1",
                created_at: "2026-11-03T00:00:00Z",
                client_visible: true,
                ...values,
              } as unknown as CatalogDocument;
              state.documents.push(doc);
              return { data: doc, error: null };
            },
          }),
        }),
      };
    },
    storage: {
      from: () => ({
        upload: async (p: string) => {
          state.uploads.push({ path: p });
          return { error: null };
        },
        createSignedUrl: async () => ({ data: { signedUrl: "https://example.test/signed" }, error: null }),
      }),
    },
  } as unknown as DocumentsClient;
}

function freshState(): FakeState {
  return { documents: [], events: [], uploads: [], insertError: null };
}

describe("fingerprintFile", () => {
  it("returns the SHA-256 of the bytes as lowercase hex", async () => {
    await expect(fingerprintFile(makeFile())).resolves.toBe(ABC_SHA256);
  });
});

describe("uploadStandingFile", () => {
  it("stores bytes once, inserts one catalog row with the fingerprint, and logs an uploaded event", async () => {
    const state = freshState();
    const service = createDocumentsService(fakeClient(state));
    const result = await service.uploadStandingFile({
      ownerId: OWNER, file: makeFile(), kind: "proof_of_funds", title: "POF",
    });
    expect(result.duplicate).toBe(false);
    expect(state.uploads).toEqual([{ path: storagePathFor(OWNER, ABC_SHA256) }]);
    expect(state.documents).toHaveLength(1);
    expect(state.documents[0].fingerprint).toBe(ABC_SHA256);
    expect(state.documents[0].kind).toBe("proof_of_funds");
    expect(state.events.map((e) => e.event)).toEqual(["uploaded"]);
  });

  it("dedupes a second upload of the same bytes into a provenance event, never a second record", async () => {
    const state = freshState();
    const first: CatalogDocument = {
      id: "doc-existing", owner_id: OWNER, kind: "proof_of_funds", title: "POF",
      storage_path: storagePathFor(OWNER, ABC_SHA256), fingerprint: ABC_SHA256,
      size_bytes: 3, mime_type: "application/pdf", client_visible: true,
      expires_at: null, created_at: "2026-11-01T00:00:00Z",
    };
    state.documents.push(first);
    const service = createDocumentsService(fakeClient(state));
    const result = await service.uploadStandingFile({
      ownerId: OWNER, file: makeFile(), kind: "proof_of_funds", title: "POF again",
    });
    expect(result.duplicate).toBe(true);
    expect(result.document.id).toBe("doc-existing");
    expect(state.documents).toHaveLength(1);
    expect(state.uploads).toEqual([]);
    expect(state.events.map((e) => e.event)).toEqual(["duplicate_upload"]);
  });
});

describe("isExpired", () => {
  it("flags only documents whose expiry date has passed", () => {
    const today = new Date("2026-11-03T12:00:00Z");
    expect(isExpired({ expires_at: "2026-11-02" }, today)).toBe(true);
    expect(isExpired({ expires_at: "2026-11-04" }, today)).toBe(false);
    expect(isExpired({ expires_at: null }, today)).toBe(false);
  });
});

describe("catalog migration (static checks)", () => {
  const sql = readFileSync(
    path.resolve(__dirname, "../../supabase/migrations/20261103210000_0706_document_catalog.sql"),
    "utf8",
  );

  it("enables RLS and revokes before granting on both tables", () => {
    for (const table of ["documents", "document_events"]) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      const revoke = sql.indexOf(`REVOKE ALL ON public.${table} FROM anon, authenticated`);
      const grant = sql.indexOf(`public.${table} TO authenticated`);
      expect(revoke).toBeGreaterThan(-1);
      expect(grant).toBeGreaterThan(revoke);
    }
  });

  it("dedupes by (owner, fingerprint) and stores files in a private bucket", () => {
    expect(sql).toContain("CREATE UNIQUE INDEX documents_owner_fingerprint_key");
    expect(sql).toContain("'standing-files', 'standing-files', false");
  });

  it("has no government-ID document kind (never-store list)", () => {
    expect(sql).not.toMatch(/government|passport|drivers_license|ssn/i);
    for (const kind of ["baa", "proof_of_funds", "operating_agreement", "ein_letter", "preapproval"]) {
      expect(sql).toContain(`'${kind}'`);
    }
  });

  it("scopes storage objects to the owner's folder or an admin", () => {
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).toContain("public.has_role(auth.uid(), 'admin')");
  });
});
