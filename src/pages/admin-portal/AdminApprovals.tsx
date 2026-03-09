import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type ApprovalRow = {
  id: string;
  user_id: string;
  requested_role: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const AdminApprovals = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [searchUserId, setSearchUserId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadPending = async () => {
    let query = supabase
      .from("portal_access_requests")
      .select("id,user_id,requested_role,status,admin_notes,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (searchUserId.trim()) {
      query = query.ilike("user_id", `%${searchUserId.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load approvals", description: error.message, variant: "destructive" });
      setRows([]);
      return;
    }

    setRows((data ?? []) as ApprovalRow[]);
  };

  useEffect(() => {
    void loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (requestId: string, decision: "approved" | "denied") => {
    const { error } = await supabase.rpc("admin_review_access_request", {
      _request_id: requestId,
      _decision: decision,
      _admin_notes: notes[requestId] ?? null,
    });

    if (error) {
      toast({ title: "Decision failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Request ${decision}` });
    void loadPending();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Approvals</h1>
        <p className="text-muted-foreground">Pending portal access requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Queue</CardTitle>
          <CardDescription>Approve or deny with internal notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Filter by user id"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadPending();
              }}
            />
            <Button onClick={() => void loadPending()}>Apply</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requested At</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                    <TableCell>{row.user_id}</TableCell>
                    <TableCell>{row.requested_role}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell className="min-w-[220px]">
                      <Textarea
                        value={notes[row.id] ?? row.admin_notes ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder="Optional notes"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void decide(row.id, "approved")}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => void decide(row.id, "denied")}>Deny</Button>
                      </div>
                    </TableCell>
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

export default AdminApprovals;
