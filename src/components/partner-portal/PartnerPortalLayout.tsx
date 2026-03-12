import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  Star, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import logo from "@/assets/integrity-logo.png";
import { usePortalAuth } from "@/hooks/usePortalAuth";

const PartnerPortalLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, loading } = usePortalAuth("partner");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: "/portal/partner", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { path: "/portal/partner/profile", label: "My Profile", icon: User },
    { path: "/portal/partner/testimonials", label: "Testimonials", icon: Star },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Integrity Realty STL" className="h-8" />
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
                Partner Portal
              </span>
            </Link>
          </div>

          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Portal</span>
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
            transform transition-transform duration-200 ease-in-out pt-16 lg:pt-0
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PartnerPortalLayout;
