import { Link } from "react-router-dom";
import { 
  Wrench, Users, AlertCircle, Phone, Mail, Globe, Building2, 
  Shield, Scale, FileCheck, Search, Home, Landmark, ChevronRight 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { 
  networkPartners, 
  getPartnersByType, 
  PartnerType 
} from "@/data/networkPartners";

const PortalLocalNetwork = () => {
  const contractors = getPartnersByType("contractor");
  const propertyManagers = getPartnersByType("property-manager");
  const dscrLenders = getPartnersByType("lender");
  const insuranceProviders = getPartnersByType("insurance");
  const attorneys = getPartnersByType("attorney");
  const titleCompanies = getPartnersByType("title-company");
  const inspectors = getPartnersByType("inspector");
  const appraisers = getPartnersByType("appraiser");
  const localBanks = getPartnersByType("bank");

  // Reusable clickable partner card
  const PartnerCard = ({ partner }: { partner: typeof networkPartners[0] }) => (
    <Link
      to={`/portal/partner/${partner.id}`}
      className="block bg-card border border-border rounded-lg p-5 shadow-card hover:border-primary/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
            {partner.name}
          </h3>
          {partner.contact && (
            <p className="text-sm text-muted-foreground mb-1">Contact: {partner.contact}</p>
          )}
          <p className="text-sm text-muted-foreground mb-3">
            {partner.specialty}
          </p>
          <div className="space-y-1 text-sm">
            {partner.phone && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-3 h-3" />
                {partner.phone}
              </span>
            )}
            {partner.email && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-3 h-3" />
                {partner.email}
              </span>
            )}
            {partner.website && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-3 h-3" />
                {partner.website}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </Link>
  );

  // Empty state for sections with no partners
  const EmptySection = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
    <div className="bg-muted/30 border border-dashed border-border rounded-lg p-6 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Network Partners
        </h1>
        <p className="text-muted-foreground text-sm">
          A directory of contractors and service providers in the North County area. 
          Click on any partner to view their full profile.
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
          {contractors.map((contractor) => (
            <PartnerCard key={contractor.id} partner={contractor} />
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
          {propertyManagers.map((pm) => (
            <PartnerCard key={pm.id} partner={pm} />
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
          {dscrLenders.map((lender) => (
            <PartnerCard key={lender.id} partner={lender} />
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
          {insuranceProviders.map((provider) => (
            <PartnerCard key={provider.id} partner={provider} />
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
            {attorneys.map((attorney) => (
              <PartnerCard key={attorney.id} partner={attorney} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Scale} text="No attorneys listed yet. Check back soon." />
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
            {titleCompanies.map((company) => (
              <PartnerCard key={company.id} partner={company} />
            ))}
          </div>
        ) : (
          <EmptySection icon={FileCheck} text="No title companies listed yet. Check back soon." />
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
            {inspectors.map((inspector) => (
              <PartnerCard key={inspector.id} partner={inspector} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Search} text="No inspectors listed yet. Check back soon." />
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
            {appraisers.map((appraiser) => (
              <PartnerCard key={appraiser.id} partner={appraiser} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Home} text="No appraisers listed yet. Check back soon." />
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
          Traditional portfolio lenders in St. Louis.
        </p>
        {localBanks.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {localBanks.map((bank) => (
              <PartnerCard key={bank.id} partner={bank} />
            ))}
          </div>
        ) : (
          <EmptySection icon={Landmark} text="No local banks listed yet. Check back soon." />
        )}
      </div>
    </div>
  );
};

export default PortalLocalNetwork;
