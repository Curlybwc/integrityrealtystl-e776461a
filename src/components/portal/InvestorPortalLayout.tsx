import { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Calculator,
  Users,
  Folder,
  User,
  Menu,
  LogOut,
  Wrench,
  FileSignature,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock auth state - replace with real auth when backend is enabled
const useInvestorAuth = () => {
  return {
    isAuthenticated: true, // For mockup purposes
    investor: {
      name: "John Investor",
      email: "john@example.com",
    },
    logout: () => {
      window.location.href = "/invest";
    },
  };
};

const navItems = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { title: "Deals", href: "/portal/deals", icon: Building2 },
  { title: "My Offers", href: "/portal/my-offers", icon: FileSignature },
  { title: "My Bids", href: "/portal/my-bids", icon: Wrench },
  { title: "Deal Analyzer", href: "/portal/analyzer", icon: Calculator },
  { title: "Section 8 Calculator", href: "/portal/section8-calculator", icon: ClipboardCheck },
  { title: "Resources", href: "/portal/resources", icon: Users },
  { title: "Documents", href: "/portal/documents", icon: Folder },
  { title: "Account", href: "/portal/account", icon: User },
];

const InvestorPortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, investor, logout } = useInvestorAuth();

  // Redirect to login if not authenticated (will work when backend is enabled)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => {
    if (path === "/portal") {
      return location.pathname === "/portal";
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
            <Link to="/portal" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-sm">IR</span>
              </div>
              <div>
                <span className="font-serif text-foreground font-medium">Investor Portal</span>
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
                  {investor.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {investor.email}
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
              Investor Portal
            </span>
            <div className="w-10" /> {/* Spacer */}
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

export default InvestorPortalLayout;
