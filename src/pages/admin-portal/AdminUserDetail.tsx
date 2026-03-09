import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const AdminUserDetail = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">User Detail</h1>
        <p className="text-muted-foreground">Manage profile, roles, and account status.</p>
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
            User detail management requires the <code>profiles</code> table and admin RPC functions 
            which will be added in a future phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserDetail;
