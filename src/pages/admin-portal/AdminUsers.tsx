import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus, UserMinus, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const PORTAL_ROLES = ["investor", "wholesaler", "partner", "admin"] as const;

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  // Add user dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    if (usersRes.data) setUsers(usersRes.data as UserProfile[]);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userHasRole = (userId: string, role: string) =>
    roles.some((r) => r.user_id === userId && r.role === role);

  const toggleRole = async (userId: string, role: string) => {
    const key = `${userId}-${role}`;
    setTogglingRole(key);

    if (userHasRole(userId, role)) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Role removed", description: `Removed ${role} access.` });
        setRoles((prev) => prev.filter((r) => !(r.user_id === userId && r.role === role)));
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: role as any });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Role added", description: `Granted ${role} access.` });
        setRoles((prev) => [...prev, { user_id: userId, role }]);
      }
    }

    setTogglingRole(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = newEmail.trim();
    const trimmedName = newName.trim();

    if (!trimmedEmail || !newPassword) {
      toast({ title: "Error", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast({ title: "Error", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setCreating(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await supabase.functions.invoke("admin-create-user", {
      body: { email: trimmedEmail, password: newPassword, full_name: trimmedName },
    });

    if (res.error || res.data?.error) {
      toast({
        title: "Error creating user",
        description: res.data?.error || res.error?.message || "Unknown error",
        variant: "destructive",
      });
    } else {
      toast({ title: "User created", description: `${trimmedEmail} has been added.` });
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setDialogOpen(false);
      fetchData();
    }

    setCreating(false);
  };

  const filtered = users.filter(
    (u) =>
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage portal access for all registered users.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="new-name">Full Name</Label>
                <Input
                  id="new-name"
                  placeholder="Jane Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password *</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  maxLength={128}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                The user's email will be pre-confirmed. You can assign portal roles after creation.
              </p>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            User Directory ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Joined</TableHead>
                    {PORTAL_ROLES.map((role) => (
                      <TableHead key={role} className="text-center capitalize">
                        {role}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.full_name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      {PORTAL_ROLES.map((role) => {
                        const has = userHasRole(user.user_id, role);
                        const isToggling =
                          togglingRole === `${user.user_id}-${role}`;
                        return (
                          <TableCell key={role} className="text-center">
                            <Button
                              variant={has ? "default" : "outline"}
                              size="sm"
                              className="h-7 w-20"
                              disabled={isToggling}
                              onClick={() => toggleRole(user.user_id, role)}
                            >
                              {isToggling ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : has ? (
                                <>
                                  <UserMinus className="w-3 h-3 mr-1" />
                                  Revoke
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Grant
                                </>
                              )}
                            </Button>
                          </TableCell>
                        );
                      })}
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
