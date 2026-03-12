import { Link } from "react-router-dom";
import { useHasRole } from "@/hooks/useHasRole";
import Layout from "@/components/Layout";
import { Shield, TrendingUp, Handshake, Users } from "lucide-react";

const allPortals = [
  { id: "investor", label: "Investor Portal", href: "/portal/investor", icon: TrendingUp, description: "Access deals, analytics, and your investment dashboard." },
  { id: "wholesaler", label: "Wholesaler Portal", href: "/wholesaler-portal", icon: Handshake, description: "Submit and manage wholesale deals." },
  { id: "partner", label: "Partner Portal", href: "/partner-portal", icon: Users, description: "Network partner dashboard and resources." },
  { id: "admin", label: "Admin Portal", href: "/admin", icon: Shield, description: "Deal screening, MLS import, and system settings." },
];


const PortalSelector = () => {
  const { hasRole } = useHasRole();
  const isAdmin = hasRole("admin");

  // Admins see all portals; others see based on their roles
  const portals = isAdmin
    ? allPortals
    : allPortals.filter((portal) => hasRole(portal.id as any));

  return (
    <Layout>
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              Choose Your Portal
            </h1>
            <p className="text-muted-foreground">
              Select a portal to continue.
            </p>
          </div>

          {portals.length === 0 ? (
            <p className="text-center text-muted-foreground">No portals available for your account.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {portals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Link
                    key={portal.id}
                    to={portal.href}
                    className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-sm hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">{portal.label}</span>
                    <span className="text-xs text-muted-foreground">{portal.description}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default PortalSelector;
