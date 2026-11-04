import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Download, AlertCircle, Upload, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DOCUMENT_KIND_LABELS,
  EXPECTED_STANDING_KINDS,
  documentsService,
  isExpired,
  type CatalogDocument,
  type DocumentKind,
} from "@/lib/documents";

// 07.06 Packet INT-07.06-1: My Documents is the investor's standing file,
// served from the document catalog (public.documents) + private storage.
// Nothing here is simulated: if the catalog cannot be read, the page says
// so instead of showing sample documents.

const PortalDocuments = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<CatalogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [kind, setKind] = useState<DocumentKind>("proof_of_funds");
  const [expiresAt, setExpiresAt] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (ownerId: string) => {
    try {
      setDocuments(await documentsService.listDocuments(ownerId));
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id ?? null;
      setUserId(id);
      if (id) void load(id);
      else setLoading(false);
    });
  }, [load]);

  const handleUpload = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    setNotice(null);
    try {
      const result = await documentsService.uploadStandingFile({
        ownerId: userId,
        file,
        kind,
        title: file.name,
        expiresAt: expiresAt || null,
      });
      setNotice(
        result.duplicate
          ? "That file is already on file — no duplicate was created."
          : "Document added to your standing file.",
      );
      await load(userId);
    } catch {
      setNotice("Upload failed. Please try again, or contact us if it keeps happening.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleDownload = async (doc: CatalogDocument) => {
    try {
      const url = await documentsService.downloadUrl(doc.storage_path);
      window.open(url, "_blank", "noopener");
    } catch {
      setNotice("Could not create a download link for that document.");
    }
  };

  const presentKinds = new Set(documents.map((d) => d.kind));
  const missingKinds = EXPECTED_STANDING_KINDS.filter((k) => !presentKinds.has(k));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">Documents & Agreements</h1>
        <p className="text-muted-foreground text-sm">
          Your standing file — the reusable documents on record for your account.
        </p>
      </div>

      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Keep originals safe</p>
          <p className="text-sm text-muted-foreground">
            Never upload a driver's license, passport, or other government ID here — we do
            not store them. Documents may be updated periodically; contact us with questions.
          </p>
        </div>
      </div>

      {notice && (
        <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{notice}</p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your documents…</p>
      ) : unavailable ? (
        <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Document management will be fully functional when the backend is connected.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-lg p-5 shadow-card space-y-3">
            <h2 className="font-medium text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4" /> Add a document
            </h2>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                <span className="block text-muted-foreground mb-1">Document type</span>
                <select
                  className="border border-border rounded-md bg-background px-2 py-2 text-sm"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as DocumentKind)}
                >
                  {Object.entries(DOCUMENT_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-muted-foreground mb-1">Expires (if applicable)</span>
                <input
                  type="date"
                  className="border border-border rounded-md bg-background px-2 py-2 text-sm"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </label>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <Button size="sm" disabled={uploading || !userId} onClick={() => fileInput.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading…" : "Choose file"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Uploading the same file twice keeps one copy — the second upload is noted, not duplicated.
            </p>
          </div>

          <div className="space-y-4">
            {documents.map((doc) => {
              const expired = isExpired(doc);
              return (
                <div key={doc.id} className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{DOCUMENT_KIND_LABELS[doc.kind]}</h3>
                      <p className="text-sm text-muted-foreground">{doc.title}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      {doc.expires_at && (
                        <span className={`text-xs px-2 py-0.5 rounded mt-2 ml-2 inline-flex items-center gap-1 ${expired ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                          <Clock className="w-3 h-3" />
                          {expired ? `Expired ${doc.expires_at}` : `Expires ${doc.expires_at}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void handleDownload(doc)}>
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              );
            })}

            {missingKinds.map((missing) => (
              <div key={missing} className="border border-dashed border-border rounded-lg p-5 flex items-center gap-4 opacity-70">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{DOCUMENT_KIND_LABELS[missing]}</h3>
                  <p className="text-sm text-muted-foreground">Not on file yet — add it above when you have it.</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PortalDocuments;
