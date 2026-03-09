import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AuditRow = {
  id: string;
  actor_user_id: string;
  target_user_id: string | null;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const AdminAuditLog = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");

  const loadRows = async () => {
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id,actor_user_id,target_user_id,action_type,target_table,target_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      toast({ title: "Failed to load audit log", description: error.message, variant: "destructive" });
      setRows([]);
      return;
    }

    setRows((data ?? []) as AuditRow[]);
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter((row) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      row.actor_user_id.toLowerCase().includes(q) ||
      (row.target_user_id ?? "").toLowerCase().includes(q) ||
      row.action_type.toLowerCase().includes(q) ||
      (row.target_table ?? "").toLowerCase().includes(q) ||
      JSON.stringify(row.metadata ?? {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">Admin-sensitive actions and metadata.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity</CardTitle>
          <CardDescription>Filter by actor, target, action, or metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search log..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button variant="outline" onClick={() => void loadRows()}>Refresh</Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell>{row.actor_user_id}</TableCell>
                    <TableCell>{row.target_user_id ?? "—"}</TableCell>
                    <TableCell>{row.action_type}</TableCell>
                    <TableCell>{row.target_table ?? "—"}</TableCell>
                    <TableCell className="max-w-[480px] truncate">{JSON.stringify(row.metadata ?? {})}</TableCell>
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

export default AdminAuditLog;
