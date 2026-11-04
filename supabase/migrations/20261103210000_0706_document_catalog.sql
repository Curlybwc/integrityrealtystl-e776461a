-- 07.06 Packet INT-07.06-1: document catalog foundation.
-- One catalog record per document (fingerprint-deduped per owner), an
-- append-only provenance event log, and a private storage bucket for
-- standing files. Spec: 07.06 DC-R01/DC-R03 (catalog + provenance),
-- decided standing-file set (Q9), never-store list (Q65/A36).

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'baa', 'proof_of_funds', 'operating_agreement', 'articles',
    'ein_letter', 'preapproval', 'lender_document', 'other'
  )),
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  fingerprint CHAR(64) NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  mime_type TEXT NOT NULL,
  client_visible BOOLEAN NOT NULL DEFAULT true,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dedupe: the same bytes under the same owner are one catalog record.
CREATE UNIQUE INDEX documents_owner_fingerprint_key
  ON public.documents (owner_id, fingerprint);
CREATE INDEX documents_owner_created_idx
  ON public.documents (owner_id, created_at DESC);

CREATE TABLE public.document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  event TEXT NOT NULL CHECK (event IN (
    'uploaded', 'duplicate_upload', 'staff_filed', 'visibility_changed'
  )),
  source TEXT NOT NULL DEFAULT 'portal_upload',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX document_events_document_idx
  ON public.document_events (document_id, created_at);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.documents FROM anon, authenticated;
REVOKE ALL ON public.document_events FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
GRANT SELECT, INSERT ON public.document_events TO authenticated;
GRANT ALL ON public.documents TO service_role;
GRANT ALL ON public.document_events TO service_role;

-- Catalog: an owner sees and manages only their own records; admins see all.
CREATE POLICY "Owners can view their own documents"
  ON public.documents FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can add their own documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can update their own documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Provenance is append-only for clients: readable for own documents,
-- insertable, never updatable or deletable through the API.
CREATE POLICY "Owners can view events for their own documents"
  ON public.document_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "Actors can append events for accessible documents"
  ON public.document_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id
      AND (d.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- Private storage for standing files. Object path: <owner_id>/<fingerprint>.
INSERT INTO storage.buckets (id, name, public)
VALUES ('standing-files', 'standing-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owners can read their own standing files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'standing-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners can upload their own standing files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'standing-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners can update their own standing files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'standing-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners can delete their own standing files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'standing-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')));
