import { AlertCircle, Eye, Scale } from "lucide-react";

const WholesalerDisclaimers = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-serif text-2xl text-center text-foreground mb-8">
          Important Information
        </h2>

        <div className="space-y-6">
          {/* Wholesaler Disclaimer */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  For Wholesalers
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Integrity Realty STL does not verify or guarantee wholesaler-submitted 
                  information. Submission does not create an agency relationship or 
                  guarantee acceptance or sale. Wholesalers are responsible for the 
                  accuracy of all information submitted.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  No Direct Investor Contact
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Wholesaler contact information is never shared with investors. 
                  All investor inquiries are managed through Integrity Realty STL. 
                  This protects both parties and ensures professional communication.
                </p>
              </div>
            </div>
          </div>

          {/* Agency Disclosure */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  No Agency Relationship
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Submitting an application or posting deals does not create an 
                  agency relationship between the wholesaler and Integrity Realty STL. 
                  Each transaction is handled according to its own terms and agreements.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Integrity Realty STL reserves the right to remove any deal, revoke 
          wholesaler access, or modify portal terms at any time.
        </p>
      </div>
    </section>
  );
};

export default WholesalerDisclaimers;
