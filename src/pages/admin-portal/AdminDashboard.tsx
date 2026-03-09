import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Eye, EyeOff, CheckCircle, Archive, Users, UserCheck, UserX, ClipboardCheck, History, PlugZap, Search } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";
import { supabase } from "@/integrations/supabase/client";

type AdminOverview = {
  totalUsers: number;
  pendingApprovals: number;
  activeInvestors: number;
  activeWholesalers: number;
  activePartners: number;
  disabledUsers: number;
  recentAdminActions: number;
  dotloopConnected: boolean;
};

const AdminDashboard = () => {
  const { getDealsByTab } = useDeals();
  const [overview, setOverview] = useState<AdminOverview>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeInvestors: 0,
    activeWholesalers: 0,
    activePartners: 0,
    disabledUsers: 0,
    recentAdminActions: 0,
    dotloopConnected: false,
  });

  const unreviewedCount = getDealsByTab("unreviewed").length;
  const reviewedCount = getDealsByTab("reviewed").length;
  const removedCount = getDealsByTab("removed").length;
  const archivedCount = getDealsByTab("archived").length;

  useEffect(() => {
    const loadOverview = async () => {
      const [
        usersResp,
        pendingResp,
        disabledResp,
        rolesResp,
        auditResp,
        integrationResp,
      ] = await Promise.all([
        supabase.rpc("admin_list_users", { _search: null, _status: null }),
        supabase.from("portal_access_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("status", "disabled"),
        supabase.from("user_roles").select("role"),
        supabase.from("admin_audit_log").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("company_integrations").select("connected").eq("provider", "dotloop").maybeSingle(),
      ]);

      const users = (usersResp.data ?? []) as Array<{ user_id: string }>;
      const roles = (rolesResp.data ?? []) as Array<{ role: string }>;

      setOverview({
        totalUsers: users.length,
        pendingApprovals: pendingResp.count ?? 0,
        activeInvestors: roles.filter((r) => r.role === "investor").length,
        activeWholesalers: roles.filter((r) => r.role === "wholesaler").length,
        activePartners: roles.filter((r) => r.role === "partner").length,
        disabledUsers: disabledResp.count ?? 0,
        recentAdminActions: auditResp.count ?? 0,
        dotloopConnected: Boolean(integrationResp.data?.connected),
      });
    };

    void loadOverview();
  }, []);

  const dealStats = [
    {
      title: "Passing Unreviewed",
      value: unreviewedCount,
      description: "Deals needing admin review",
      icon: Eye,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Passing Reviewed",
      value: reviewedCount,
      description: "Visible to buyers",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Removed",
      value: removedCount,
      description: "Failed after admin override",
      icon: EyeOff,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Archived Sold",
      value: archivedCount,
      description: "Completed transactions",
      icon: Archive,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ];

  const adminStats = useMemo(
    () => [
      { title: "Total Users", value: overview.totalUsers, icon: Users },
      { title: "Pending Approvals", value: overview.pendingApprovals, icon: ClipboardCheck },
      { title: "Active Investors", value: overview.activeInvestors, icon: UserCheck },
      { title: "Active Wholesalers", value: overview.activeWholesalers, icon: UserCheck },
      { title: "Active Partners", value: overview.activePartners, icon: UserCheck },
      { title: "Disabled Users", value: overview.disabledUsers, icon: UserX },
      { title: "Recent Admin Actions (7d)", value: overview.recentAdminActions, icon: History },
      { title: "Dotloop Status", value: overview.dotloopConnected ? "Connected" : "Not Connected", icon: PlugZap },
    ],
    [overview]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Control-center overview with user access, integrations, and deal operations.</p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Admin Control Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.title}</CardDescription>
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Deal Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dealStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.title}</CardDescription>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common admin tasks across user/access and deal operations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link to="/portal/admin/users"><Users className="w-4 h-4 mr-2" />Users</Link></Button>
          <Button variant="outline" asChild><Link to="/portal/admin/approvals"><ClipboardCheck className="w-4 h-4 mr-2" />Approvals ({overview.pendingApprovals})</Link></Button>
          <Button variant="outline" asChild><Link to="/portal/admin/audit"><History className="w-4 h-4 mr-2" />Audit</Link></Button>
          <Button variant="outline" asChild><Link to="/portal/admin/integrations"><PlugZap className="w-4 h-4 mr-2" />Integrations / Dotloop</Link></Button>
          <Button asChild><Link to="/portal/admin/deal-pot"><Building2 className="w-4 h-4 mr-2" />Deal Pot</Link></Button>
          <Button variant="outline" asChild><Link to="/portal/admin/mls-import"><Search className="w-4 h-4 mr-2" />MLS Import</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
