import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const AdminAuditLog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">Admin-sensitive actions and metadata.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The audit log requires the <code>admin_audit_log</code> table which will be added in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog;
