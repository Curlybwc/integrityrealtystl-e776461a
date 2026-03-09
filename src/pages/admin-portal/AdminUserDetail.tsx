import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveActiveImpersonation } from "@/hooks/useImpersonation";

type ProfileStatus = "pending" | "active" | "disabled" | "archived";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  notes: string | null;
  status: ProfileStatus;
};

type AuditRow = {
  id: string;
  actor_user_id: string;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

const ROLE_OPTIONS = ["investor", "wholesaler", "partner", "admin"];

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonationReason, setImpersonationReason] = useState("");

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);

    const [{ data: profileData }, { data: roleData }, { data: auditData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("admin_audit_log")
        .select("id,actor_user_id,action_type,metadata,created_at")
        .eq("target_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setProfile((profileData as ProfileRow | null) ?? {
      user_id: userId,
      display_name: null,
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      company: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      postal_code: null,
      notes: null,
      status: "pending",
    });
    setRoles((roleData ?? []).map((r) => r.role));
    setAuditRows((auditData ?? []) as AuditRow[]);

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateField = (key: keyof ProfileRow, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  const saveProfile = async () => {
    if (!profile || !userId) return;

    const { error } = await supabase.rpc("admin_update_profile", {
      _target_user_id: userId,
      _display_name: profile.display_name,
      _first_name: profile.first_name,
      _last_name: profile.last_name,
      _email: profile.email,
      _phone: profile.phone,
      _company: profile.company,
      _address_line1: profile.address_line1,
      _address_line2: profile.address_line2,
      _city: profile.city,
      _state: profile.state,
      _postal_code: profile.postal_code,
      _notes: profile.notes,
      _status: profile.status,
    });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Profile saved" });
    void loadData();
  };

  const setStatus = async (status: ProfileStatus) => {
    if (!userId) return;
    const { error } = await supabase.rpc("admin_set_user_status", {
      _target_user_id: userId,
      _status: status,
    });
    if (error) {
      toast({ title: "Status update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Status updated", description: `Set to ${status}.` });
    void loadData();
  };

  const grantRole = async (role: string) => {
    if (!userId) return;
    const { error } = await supabase.rpc("admin_grant_role", { _target_user_id: userId, _role: role });
    if (error) {
      toast({ title: "Role grant failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role granted" });
    void loadData();
  };

  const revokeRole = async (role: string) => {
    if (!userId) return;
    const { error } = await supabase.rpc("admin_revoke_role", { _target_user_id: userId, _role: role });
    if (error) {
      toast({ title: "Role revoke failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Role revoked" });
    void loadData();
  };


  const startImpersonation = async () => {
    if (!userId || !profile) return;

    const reason = impersonationReason.trim();
    if (!reason) {
      toast({ title: "Reason required", description: "Enter a support reason before impersonation.", variant: "destructive" });
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      toast({ title: "Not authenticated", description: "Please sign in again.", variant: "destructive" });
      return;
    }

    const { data, error } = await supabase.rpc("admin_start_impersonation", {
      _target_user_id: userId,
      _reason: reason,
    });

    if (error || !data) {
      toast({ title: "Impersonation start failed", description: error?.message ?? "Unable to start impersonation.", variant: "destructive" });
      return;
    }

    saveActiveImpersonation({
      sessionId: data,
      adminUserId: authData.user.id,
      adminEmail: authData.user.email ?? "admin",
      targetUserId: userId,
      targetEmail: profile.email ?? profile.display_name ?? userId,
      reason,
      startedAt: new Date().toISOString(),
    });

    toast({
      title: "Support view started",
      description: "Impersonation banner is now active. Auth session remains your admin session.",
    });
  };

  if (loading || !profile) {
    return <div className="text-sm text-muted-foreground">Loading user details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">User Detail</h1>
        <p className="text-muted-foreground">Manage profile, roles, and account status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
          <CardDescription>Editable user profile fields.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Display Name</Label><Input value={profile.display_name ?? ""} onChange={(e) => updateField("display_name", e.target.value)} /></div>
          <div><Label>Email</Label><Input value={profile.email ?? ""} onChange={(e) => updateField("email", e.target.value)} /></div>
          <div><Label>First Name</Label><Input value={profile.first_name ?? ""} onChange={(e) => updateField("first_name", e.target.value)} /></div>
          <div><Label>Last Name</Label><Input value={profile.last_name ?? ""} onChange={(e) => updateField("last_name", e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} /></div>
          <div><Label>Company</Label><Input value={profile.company ?? ""} onChange={(e) => updateField("company", e.target.value)} /></div>
          <div><Label>Address 1</Label><Input value={profile.address_line1 ?? ""} onChange={(e) => updateField("address_line1", e.target.value)} /></div>
          <div><Label>Address 2</Label><Input value={profile.address_line2 ?? ""} onChange={(e) => updateField("address_line2", e.target.value)} /></div>
          <div><Label>City</Label><Input value={profile.city ?? ""} onChange={(e) => updateField("city", e.target.value)} /></div>
          <div><Label>State</Label><Input value={profile.state ?? ""} onChange={(e) => updateField("state", e.target.value)} /></div>
          <div><Label>Postal Code</Label><Input value={profile.postal_code ?? ""} onChange={(e) => updateField("postal_code", e.target.value)} /></div>
          <div>
            <Label>Status</Label>
            <Select value={profile.status} onValueChange={(value: ProfileStatus) => setProfile({ ...profile, status: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="disabled">disabled</SelectItem>
                <SelectItem value="archived">archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Notes</Label><Textarea value={profile.notes ?? ""} onChange={(e) => updateField("notes", e.target.value)} /></div>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button onClick={() => void saveProfile()}>Save Profile</Button>
            <Button variant="secondary" onClick={() => void setStatus("disabled")}>Disable</Button>
            <Button variant="secondary" onClick={() => void setStatus("archived")}>Archive</Button>
            <div className="w-full md:w-auto min-w-[280px]">
              <Label>Impersonation Reason (required)</Label>
              <Input
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                placeholder="Support/debug reason"
              />
            </div>
            <Button variant="outline" onClick={() => void startImpersonation()}>Start Impersonation</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Portal Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? <Badge variant="outline">No roles</Badge> : roles.map((role) => <Badge key={role}>{role}</Badge>)}
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(value) => void grantRole(value)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Grant role" /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => void revokeRole(value)}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Revoke role" /></SelectTrigger>
              <SelectContent>
                {roles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Audit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell>{row.actor_user_id}</TableCell>
                    <TableCell>{row.action_type}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{JSON.stringify(row.metadata ?? {})}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetail;
