import { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  User,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock auth state - replace with real auth when backend is enabled
const useWholesalerAuth = () => {
  return {
    isAuthenticated: true, // For mockup purposes
    wholesaler: {
      name: "Mike Wholesaler",
      email: "mike@deals.com",
      company: "Quick Flip Properties",
    },
    logout: () => {
      window.location.href = "/wholesalers";
    },
  };
};

const navItems = [
  { title: "Dashboard", href: "/wholesaler-portal", icon: LayoutDashboard },
  { title: "My Deals", href: "/wholesaler-portal/deals", icon: Building2 },
  { title: "Add New Deal", href: "/wholesaler-portal/add-deal", icon: PlusCircle },
  { title: "Account", href: "/wholesaler-portal/account", icon: User },
];

const WholesalerPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, wholesaler, logout } = useWholesalerAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/wholesaler-login" replace />;
  }

  const isActive = (path: string) => {
    if (path === "/wholesaler-portal") {
      return location.pathname === "/wholesaler-portal";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <Link to="/wholesaler-portal" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-sm">WP</span>
              </div>
              <div>
                <span className="font-serif text-foreground font-medium">Wholesaler Portal</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {wholesaler.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {wholesaler.company}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-serif text-foreground font-medium">
              Wholesaler Portal
            </span>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WholesalerPortalLayout;
