import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ProfileStatus = "pending" | "active" | "disabled" | "archived";

type UserDirectoryRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  profile_status: ProfileStatus | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[] | null;
  approval_status: string | null;
};

const STATUS_OPTIONS: ProfileStatus[] = ["pending", "active", "disabled", "archived"];
const ROLE_OPTIONS = ["investor", "wholesaler", "partner", "admin"];

const AdminUsers = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<UserDirectoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users", {
      _search: search.trim() || null,
      _status: statusFilter === "all" ? null : statusFilter,
    });

    if (error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data ?? []) as UserDirectoryRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quickStatusChange = async (userId: string, status: ProfileStatus) => {
    const { error } = await supabase.rpc("admin_set_user_status", {
      _target_user_id: userId,
      _status: status,
    });
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated", description: `Set to ${status}.` });
    void fetchUsers();
  };

  const grantRole = async (userId: string, role: string) => {
    const { error } = await supabase.rpc("admin_grant_role", {
      _target_user_id: userId,
      _role: role,
    });
    if (error) {
      toast({ title: "Role grant failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role granted", description: `${role} granted.` });
    void fetchUsers();
  };

  const revokeRole = async (userId: string, role: string) => {
    const { error } = await supabase.rpc("admin_revoke_role", {
      _target_user_id: userId,
      _role: role,
    });
    if (error) {
      toast({ title: "Role revoke failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role revoked", description: `${role} removed.` });
    void fetchUsers();
  };

  const approveLatestPending = async (userId: string) => {
    const { data: pending, error: pendingError } = await supabase
      .from("portal_access_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError || !pending) {
      toast({ title: "No pending request", description: pendingError?.message ?? "Nothing to approve.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.rpc("admin_review_access_request", {
      _request_id: pending.id,
      _decision: "approved",
      _admin_notes: "Approved from user directory",
    });

    if (error) {
      toast({ title: "Approval failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Request approved" });
    void fetchUsers();
  };

  const directoryRows = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Users</h1>
        <p className="text-muted-foreground">Directory and access controls for all portal users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search by name, email, company, or phone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void fetchUsers();
            }}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-56">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => void fetchUsers()}>Apply</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign-In</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directoryRows.map((row) => (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-medium">{row.display_name || `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—"}</TableCell>
                      <TableCell>{row.email ?? "—"}</TableCell>
                      <TableCell>{row.phone ?? "—"}</TableCell>
                      <TableCell>{row.company ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(row.roles ?? []).map((role) => (
                            <Badge key={role} variant="secondary">{role}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{row.approval_status ?? "—"}</TableCell>
                      <TableCell>{row.profile_status ?? "pending"}</TableCell>
                      <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/portal/admin/users/${row.user_id}`}>Detail</Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void approveLatestPending(row.user_id)}>Approve</Button>
                          <Button size="sm" variant="secondary" onClick={() => void quickStatusChange(row.user_id, "disabled")}>Disable</Button>
                          <Select onValueChange={(role) => void grantRole(row.user_id, role)}>
                            <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Grant role" /></SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select onValueChange={(role) => void revokeRole(row.user_id, role)}>
                            <SelectTrigger className="h-8 w-[130px]"><SelectValue placeholder="Revoke role" /></SelectTrigger>
                            <SelectContent>
                              {(row.roles ?? []).map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
