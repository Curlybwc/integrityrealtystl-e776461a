// 07.06 document catalog — standing files (Packet INT-07.06-1).
// One catalog record per document, deduped by content fingerprint per
// owner; every upload (including a duplicate) leaves a provenance event.
// Spec: builds/spec-pass/specs/07/07.06-documents-esign-dotloop.md
// (DC-R01 catalog + provenance, Q9 standing-file set, Q65 never-store).

import { supabase } from "@/integrations/supabase/client";

export const DOCUMENT_KINDS = [
  "baa",
  "proof_of_funds",
  "operating_agreement",
  "articles",
  "ein_letter",
  "preapproval",
  "lender_document",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  baa: "Buyer Agency Agreement",
  proof_of_funds: "Proof of Funds",
  operating_agreement: "LLC Operating Agreement",
  articles: "Articles of Organization",
  ein_letter: "EIN Letter",
  preapproval: "Lender Preapproval",
  lender_document: "Lender Document",
  other: "Other Document",
};

// The standing-file kinds an investor is expected to keep on file
// (decided Q9/Q12). Shown as open slots while a kind is missing.
export const EXPECTED_STANDING_KINDS: DocumentKind[] = [
  "baa",
  "proof_of_funds",
  "operating_agreement",
  "articles",
  "ein_letter",
  "preapproval",
];

export interface CatalogDocument {
  id: string;
  owner_id: string;
  kind: DocumentKind;
  title: string;
  storage_path: string;
  fingerprint: string;
  size_bytes: number;
  mime_type: string;
  client_visible: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface UploadResult {
  document: CatalogDocument;
  duplicate: boolean;
}

async function blobBytes(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  // Fallback for environments whose Blob lacks arrayBuffer() (e.g. jsdom).
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** SHA-256 of the file bytes, lowercase hex — the catalog fingerprint. */
export async function fingerprintFile(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blobBytes(file));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function storagePathFor(ownerId: string, fingerprint: string): string {
  return `${ownerId}/${fingerprint}`;
}

export function isExpired(doc: Pick<CatalogDocument, "expires_at">, today = new Date()): boolean {
  if (!doc.expires_at) return false;
  return doc.expires_at < today.toISOString().slice(0, 10);
}

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message: string } | null }>;

// The narrow slice of the Supabase client this module uses, so tests can
// drive it with a fake (repo pattern: pure logic + injected dependencies).
export interface DocumentsClient {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          maybeSingle(): QueryResult<CatalogDocument | null>;
        };
        order(column: string, options: { ascending: boolean }): QueryResult<CatalogDocument[]>;
      };
    };
    insert(values: Record<string, unknown>): {
      select(columns: string): { single(): QueryResult<CatalogDocument> };
    };
  };
  storage: {
    from(bucket: string): {
      upload(path: string, file: Blob, options: { upsert: boolean }): Promise<{ error: { message: string } | null }>;
      createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
    };
  };
}

const UNIQUE_VIOLATION = "23505";

export function createDocumentsService(client: DocumentsClient) {
  async function findByFingerprint(ownerId: string, fingerprint: string) {
    const { data, error } = await client
      .from("documents")
      .select("*")
      .eq("owner_id", ownerId)
      .eq("fingerprint", fingerprint)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async function appendEvent(documentId: string, actorId: string, event: string) {
    const { error } = await client.from("document_events").insert({
      document_id: documentId,
      actor_id: actorId,
      event,
      source: "portal_upload",
    }).select("id").single();
    if (error) throw new Error(error.message);
  }

  return {
    /** The caller's own catalog rows, newest first. RLS also enforces this. */
    async listDocuments(ownerId: string): Promise<CatalogDocument[]> {
      const { data, error } = await client
        .from("documents")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },

    /**
     * Upload a standing file. Same bytes + same owner = the existing
     * catalog record with a `duplicate_upload` provenance event, never a
     * second record (spec AC1).
     */
    async uploadStandingFile(args: {
      ownerId: string;
      file: File;
      kind: DocumentKind;
      title: string;
      expiresAt?: string | null;
    }): Promise<UploadResult> {
      const fingerprint = await fingerprintFile(args.file);
      const storagePath = storagePathFor(args.ownerId, fingerprint);

      const existing = await findByFingerprint(args.ownerId, fingerprint);
      if (existing) {
        await appendEvent(existing.id, args.ownerId, "duplicate_upload");
        return { document: existing, duplicate: true };
      }

      const upload = await client.storage
        .from("standing-files")
        .upload(storagePath, args.file, { upsert: false });
      // A storage conflict means an earlier attempt stored the bytes but
      // not the catalog row; the insert below is the record that matters.
      if (upload.error && !/exist/i.test(upload.error.message)) {
        throw new Error(upload.error.message);
      }

      const { data, error } = await client.from("documents").insert({
        owner_id: args.ownerId,
        kind: args.kind,
        title: args.title,
        storage_path: storagePath,
        fingerprint,
        size_bytes: args.file.size,
        mime_type: args.file.type || "application/octet-stream",
        expires_at: args.expiresAt ?? null,
      }).select("*").single();

      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          const raced = await findByFingerprint(args.ownerId, fingerprint);
          if (raced) {
            await appendEvent(raced.id, args.ownerId, "duplicate_upload");
            return { document: raced, duplicate: true };
          }
        }
        throw new Error(error.message);
      }
      await appendEvent(data.id, args.ownerId, "uploaded");
      return { document: data, duplicate: false };
    },

    async downloadUrl(storagePath: string): Promise<string> {
      const { data, error } = await client.storage
        .from("standing-files")
        .createSignedUrl(storagePath, 60);
      if (error || !data) throw new Error(error?.message ?? "Could not create download link");
      return data.signedUrl;
    },
  };
}

export const documentsService = createDocumentsService(supabase as unknown as DocumentsClient);
