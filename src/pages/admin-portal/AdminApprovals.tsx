import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AccessRequest {
  id: string;
  user_id: string;
  portal: string;
  status: string;
  message: string | null;
  created_at: string;
  profiles: {
    email: string | null;
    full_name: string | null;
  } | null;
}

const AdminApprovals = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_access_requests")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });

    if (data) setRequests(data as unknown as AccessRequest[]);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (request: AccessRequest, action: "approved" | "denied") => {
    setProcessingId(request.id);

    const { data: authData } = await supabase.auth.getUser();

    // Update request status
    const { error: updateError } = await supabase
      .from("portal_access_requests")
      .update({
        status: action,
        reviewed_by: authData.user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      setProcessingId(null);
      return;
    }

    // If approved, grant the role
    if (action === "approved") {
      const roleMap: Record<string, string> = {
        investor: "user",
        wholesaler: "user",
        partner: "moderator",
        admin: "admin",
      };
      
      // Grant role in user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: request.user_id,
          role: (roleMap[request.portal] || "user") as any,
        }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Role grant error:", roleError);
      }
    }

    toast({
      title: action === "approved" ? "Access Approved" : "Access Denied",
      description: `${request.portal} portal access ${action} for ${request.profiles?.email || "user"}.`,
    });

    // Update local state
    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: action } : r))
    );
    setProcessingId(null);
  };

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "denied":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderTable = (items: AccessRequest[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Portal</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((req) => (
          <TableRow key={req.id}>
            <TableCell>
              <div>
                <p className="font-medium text-foreground">
                  {req.profiles?.full_name || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {req.profiles?.email || "Unknown"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="capitalize">{req.portal}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
              {req.message || "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(req.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>{statusBadge(req.status)}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleAction(req, "approved")}
                    disabled={processingId === req.id}
                  >
                    {processingId === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(req, "denied")}
                    disabled={processingId === req.id}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Deny
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Approvals</h1>
        <p className="text-muted-foreground">
          Review and manage portal access requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Requests ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No pending requests. 🎉
            </p>
          ) : (
            renderTable(pending, true)
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Previous Requests ({resolved.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderTable(resolved, false)}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminApprovals;
