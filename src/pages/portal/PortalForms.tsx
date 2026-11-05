import { useMemo, useState } from "react";
import { Download, Eye, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FORM_CATEGORIES,
  formFileUrl,
  formsByCategory,
  type LibraryForm,
} from "@/lib/forms";

// 07.06 Packet INT-07.06-3: the brokerage's SLAR forms library — Jen's
// standard contract set, on hand where the team works. Every entry opens
// the exact source PDF stored with the app.

const FormRow = ({ form }: { form: LibraryForm }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
    <div className="flex items-start gap-3 min-w-0">
      <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{form.name}</p>
        <p className="text-xs text-muted-foreground">
          {form.slarNumber ? `SLAR ${form.slarNumber} · ` : ""}
          {form.blurb}
        </p>
      </div>
    </div>
    <div className="flex gap-2 shrink-0">
      <Button size="sm" variant="outline" asChild>
        <a href={formFileUrl(form)} target="_blank" rel="noreferrer">
          <Eye className="w-4 h-4 mr-1" /> View
        </a>
      </Button>
      <Button size="sm" variant="outline" asChild>
        <a href={formFileUrl(form)} download={form.file}>
          <Download className="w-4 h-4 mr-1" /> Download
        </a>
      </Button>
    </div>
  </div>
);

const PortalForms = () => {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return FORM_CATEGORIES.flatMap((c) => formsByCategory(c)).filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.slarNumber ?? "").toLowerCase().includes(q) ||
        f.blurb.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Forms Library</h1>
        <p className="text-sm text-muted-foreground">
          The brokerage's standard SLAR forms for purchases and sales — the same files
          the team works from, kept with the app.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or SLAR number…"
          className="pl-9"
        />
      </div>

      {filtered ? (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No forms match that search.</p>
          ) : (
            filtered.map((f) => <FormRow key={f.id} form={f} />)
          )}
        </div>
      ) : (
        FORM_CATEGORIES.map((category) => {
          const forms = formsByCategory(category);
          if (forms.length === 0) return null;
          return (
            <section key={category} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </h2>
              {forms.map((f) => (
                <FormRow key={f.id} form={f} />
              ))}
            </section>
          );
        })
      )}
    </div>
  );
};

export default PortalForms;
