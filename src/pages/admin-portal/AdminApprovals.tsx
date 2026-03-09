import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const AdminApprovals = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Approvals</h1>
        <p className="text-muted-foreground">Pending portal access requests.</p>
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
            The approvals workflow requires the <code>portal_access_requests</code> table and 
            supporting database functions which will be added in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApprovals;
