import { Wrench, Users, AlertCircle, Phone, Mail, Globe, Building2, Shield, Scale, FileCheck, Search, Home, Landmark } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { networkContractors } from "@/data/networkContractors";

const PortalResources = () => {
  // Use shared contractor data
  const contractors = networkContractors;

  const propertyManagers = [
    {
      name: "Gateway Property Management",
      focus: "Single-Family, Small Multi-Family",
      phone: "(314) 555-0201",
      website: "www.gatewaypmstl.com",
    },
    {
      name: "North County Rentals",
      focus: "Section 8, Affordable Housing",
      phone: "(314) 555-0202",
      website: "www.northcountyrentals.com",
    },
  ];

  const dscrLenders = [
    {
      company: "LoanBidZ",
      contact: "Nate Herndon",
      phone: "417-605-2196",
      email: "nate@loanbidz.com",
    },
    {
      company: "TMD",
      contact: "Mike",
      phone: "413-272-9686",
      email: null,
    },
    {
      company: "Investor Property Loans",
      contact: "KO",
      phone: "310-848-9776",
      email: "ko@investorpropertyloan.com",
    },
    {
      company: "FMS Investor Financing",
      contact: "Bobby Lee",
      phone: "630-282-7527",
      email: "blee@fmsinvestor.com",
      website: "fmsinvestor.com",
    },
    {
      company: "HouseMAX Leo",
      contact: "Leo",
      phone: "737-587-3604",
      email: null,
    },
    {
      company: "Bello Mortgage",
      contact: "Brett",
      phone: "727-277-3886",
      email: "brett@bellomortgage.com",
    },
    {
      company: "Bluebird Lending",
      contact: "Teresa",
      phone: null,
      email: null,
    },
    {
      company: "Trulo Mortgage",
      contact: "Sam",
      phone: null,
      email: null,
    },
    {
      company: "RCN Capital",
      contact: "Scott",
      phone: null,
      email: null,
    },
    {
      company: "Center Street Lending",
      contact: "Guy Clauss",
      phone: "949-270-3418",
      email: "gclauss@centerstreetlending.com",
    },
  ];

  const insuranceProviders = [
    {
      company: "Shelter Insurance",
      contact: "Mike Finney",
      focus: "Investment Properties",
      website: "shelterinsurance.com/CA/agent/mikefinney",
    },
  ];

  const attorneys: { name: string; focus: string; phone?: string; email?: string; website?: string }[] = [];
  const titleCompanies: { name: string; focus?: string; phone?: string; email?: string; website?: string }[] = [];
  const inspectors: { name: string; focus?: string; phone?: string; email?: string; website?: string }[] = [];
  const appraisers: { name: string; focus?: string; phone?: string; email?: string; website?: string }[] = [];
  const localBanks: { name: string; contact?: string; focus?: string; phone?: string; email?: string; website?: string }[] = [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Local Network
        </h1>
        <p className="text-muted-foreground text-sm">
          A directory of contractors and property managers in the North County area. 
          This list is informational only.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-accent/50 border border-border rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
          <p className="text-sm text-muted-foreground">
            This directory is provided for informational purposes only. Integrity Realty STL 
            does not endorse, guarantee, or receive compensation from any listed provider. 
            Investors are responsible for vetting and selecting their own contractors and 
            property managers.
          </p>
        </div>
      </div>

      {/* Contractors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Contractors</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {contractors.map((contractor, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <h3 className="font-medium text-foreground mb-1">
                {contractor.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {contractor.specialty}
              </p>
              <div className="space-y-1 text-sm">
                <a 
                  href={`tel:${contractor.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {contractor.phone}
                </a>
                <a 
                  href={`mailto:${contractor.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-3 h-3" />
                  {contractor.email}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Property Managers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Property Managers</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {propertyManagers.map((pm, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <h3 className="font-medium text-foreground mb-1">{pm.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{pm.focus}</p>
              <div className="space-y-1 text-sm">
                <a 
                  href={`tel:${pm.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  {pm.phone}
                </a>
                <a 
                  href={`https://${pm.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  {pm.website}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* DSCR Lenders */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">DSCR Lenders</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Lenders offering Debt Service Coverage Ratio loans for investment properties.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {dscrLenders.map((lender, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <h3 className="font-medium text-foreground mb-1">{lender.company}</h3>
              <p className="text-sm text-muted-foreground mb-3">Contact: {lender.contact}</p>
              <div className="space-y-1 text-sm">
                {lender.phone && (
                  <a 
                    href={`tel:${lender.phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    {lender.phone}
                  </a>
                )}
                {lender.email && (
                  <a 
                    href={`mailto:${lender.email}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {lender.email}
                  </a>
                )}
                {lender.website && (
                  <a 
                    href={`https://${lender.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    {lender.website}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Insurance Providers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Insurance</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {insuranceProviders.map((provider, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-5 shadow-card"
            >
              <h3 className="font-medium text-foreground mb-1">{provider.company}</h3>
              <p className="text-sm text-muted-foreground mb-3">Contact: {provider.contact}</p>
              <div className="space-y-1 text-sm">
                {provider.focus && (
                  <p className="text-muted-foreground text-xs">{provider.focus}</p>
                )}
                {provider.website && (
                  <a 
                    href={`https://www.${provider.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="w-3 h-3" />
                    {provider.website}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Attorneys */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Attorneys</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Real estate and closing attorneys for investment transactions.
        </p>

        {attorneys.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {attorneys.map((attorney, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-5 shadow-card"
              >
                <h3 className="font-medium text-foreground mb-1">{attorney.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{attorney.focus}</p>
                <div className="space-y-1 text-sm">
                  {attorney.phone && (
                    <a href={`tel:${attorney.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3 h-3" />
                      {attorney.phone}
                    </a>
                  )}
                  {attorney.email && (
                    <a href={`mailto:${attorney.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-3 h-3" />
                      {attorney.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
            <Scale className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No attorneys listed yet. Check back soon.</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Title Companies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Title Companies</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Title insurance and closing services.
        </p>

        {titleCompanies.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {titleCompanies.map((company, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-5 shadow-card"
              >
                <h3 className="font-medium text-foreground mb-1">{company.name}</h3>
                {company.focus && <p className="text-sm text-muted-foreground mb-3">{company.focus}</p>}
                <div className="space-y-1 text-sm">
                  {company.phone && (
                    <a href={`tel:${company.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3 h-3" />
                      {company.phone}
                    </a>
                  )}
                  {company.email && (
                    <a href={`mailto:${company.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-3 h-3" />
                      {company.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
            <FileCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No title companies listed yet. Check back soon.</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Inspectors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Inspectors</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Home inspectors for property due diligence.
        </p>

        {inspectors.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {inspectors.map((inspector, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-5 shadow-card"
              >
                <h3 className="font-medium text-foreground mb-1">{inspector.name}</h3>
                {inspector.focus && <p className="text-sm text-muted-foreground mb-3">{inspector.focus}</p>}
                <div className="space-y-1 text-sm">
                  {inspector.phone && (
                    <a href={`tel:${inspector.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3 h-3" />
                      {inspector.phone}
                    </a>
                  )}
                  {inspector.email && (
                    <a href={`mailto:${inspector.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-3 h-3" />
                      {inspector.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No inspectors listed yet. Check back soon.</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Appraisers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Appraisers</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Property appraisers for valuation.
        </p>

        {appraisers.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {appraisers.map((appraiser, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-5 shadow-card"
              >
                <h3 className="font-medium text-foreground mb-1">{appraiser.name}</h3>
                {appraiser.focus && <p className="text-sm text-muted-foreground mb-3">{appraiser.focus}</p>}
                <div className="space-y-1 text-sm">
                  {appraiser.phone && (
                    <a href={`tel:${appraiser.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3 h-3" />
                      {appraiser.phone}
                    </a>
                  )}
                  {appraiser.email && (
                    <a href={`mailto:${appraiser.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-3 h-3" />
                      {appraiser.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
            <Home className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No appraisers listed yet. Check back soon.</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Local Banks */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Local Banks</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Local banks offering investment property financing.
        </p>

        {localBanks.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {localBanks.map((bank, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-lg p-5 shadow-card"
              >
                <h3 className="font-medium text-foreground mb-1">{bank.name}</h3>
                {bank.contact && <p className="text-sm text-muted-foreground mb-3">Contact: {bank.contact}</p>}
                <div className="space-y-1 text-sm">
                  {bank.phone && (
                    <a href={`tel:${bank.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3 h-3" />
                      {bank.phone}
                    </a>
                  )}
                  {bank.email && (
                    <a href={`mailto:${bank.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-3 h-3" />
                      {bank.email}
                    </a>
                  )}
                  {bank.website && (
                    <a href={`https://${bank.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Globe className="w-3 h-3" />
                      {bank.website}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
            <Landmark className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No local banks listed yet. Check back soon.</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          Have a contractor, property manager, lender, attorney, or other professional you'd recommend? Let us know and we 
          may add them to the directory (after vetting).
        </p>
      </div>
    </div>
  );
};

export default PortalResources;
