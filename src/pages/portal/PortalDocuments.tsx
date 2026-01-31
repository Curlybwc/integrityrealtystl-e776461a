import { FileText, Download, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const PortalDocuments = () => {
  const documents = [
    {
      title: "Exclusive Buyer Agency Agreement",
      description: "The agreement governing our representation relationship.",
      type: "Agreement",
      action: "View",
    },
    {
      title: "Agency Disclosure",
      description: "Information about agency relationships in real estate transactions.",
      type: "Disclosure",
      action: "Download",
    },
    {
      title: "Investment Property Checklist",
      description: "A checklist for evaluating investment properties.",
      type: "Resource",
      action: "Download",
    },
    {
      title: "Due Diligence Guide",
      description: "Steps to take when evaluating a property before purchase.",
      type: "Resource",
      action: "Download",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Documents & Agreements
        </h1>
        <p className="text-muted-foreground text-sm">
          Access your agreements, disclosures, and reference materials.
        </p>
      </div>

      {/* Notice */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Document Updates</p>
          <p className="text-sm text-muted-foreground">
            Documents may be updated periodically. You are responsible for reviewing 
            current versions. Contact us if you have questions about any document.
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-5 shadow-card flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">{doc.description}</p>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                  {doc.type}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              {doc.action === "Download" ? (
                <Download className="w-4 h-4 mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              {doc.action}
            </Button>
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Document management will be fully functional when the backend is connected.
        </p>
      </div>
    </div>
  );
};

export default PortalDocuments;
