import { Link } from "react-router-dom";
import { useHasRole } from "@/hooks/useHasRole";

const PortalSelector = () => {
  const { hasRole } = useHasRole();

  const portals = [
    { role: "investor", label: "Investor Portal", href: "/portal/investor" },
    { role: "wholesaler", label: "Wholesaler Portal", href: "/portal/wholesaler" },
    { role: "partner", label: "Partner Portal", href: "/portal/partner" },
    { role: "admin", label: "Admin Portal", href: "/portal/admin" },
  ].filter((portal) => hasRole(portal.role));

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="container mx-auto max-w-xl">
        <h1 className="text-3xl font-serif text-foreground mb-6">Choose Your Portal</h1>

        {portals.length === 0 ? (
          <p className="text-muted-foreground">No portals available for your account.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {portals.map((portal) => (
              <Link
                key={portal.role}
                to={portal.href}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {portal.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalSelector;
