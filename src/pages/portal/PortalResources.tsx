import { Wrench, Users, AlertCircle, Phone, Mail, Globe } from "lucide-react";
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-foreground mb-2">
          Resource Directory
        </h1>
        <p className="text-muted-foreground text-sm">
          A directory of contractors and property managers for your reference. 
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
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {contractor.phone}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  {contractor.email}
                </p>
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
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  {pm.phone}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  {pm.website}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          Have a contractor or property manager you'd recommend? Let us know and we 
          may add them to the directory (after vetting).
        </p>
      </div>
    </div>
  );
};

export default PortalResources;
