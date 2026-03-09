import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DotloopStatus = {
  provider: "dotloop";
  connected?: boolean;
  connected_by?: string | null;
  connected_at?: string | null;
  account_label?: string | null;
  last_sync_at?: string | null;
  access_token_expires_at?: string | null;
  health_status?: string | null;
  error_metadata?: Record<string, unknown> | null;
  updated_at?: string;
};

const AdminIntegrations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DotloopStatus>({ provider: "dotloop", connected: false });

  const loadStatus = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("dotloop-admin", {
      body: { action: "status" },
    });

    if (error || data?.error) {
      toast({
        title: "Failed to load Dotloop status",
        description: error?.message ?? data?.error ?? "Unknown error",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setStatus((data?.status as DotloopStatus) ?? { provider: "dotloop", connected: false });
    setLoading(false);
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startConnect = async () => {
    const { data, error } = await supabase.functions.invoke("dotloop-auth-start", { body: {} });
    if (error || data?.error || !data?.auth_url) {
      toast({
        title: "Unable to start Dotloop connect",
        description: error?.message ?? data?.error ?? "Missing auth URL",
        variant: "destructive",
      });
      return;
    }

    window.location.href = data.auth_url;
  };

  const disconnect = async () => {
    const { data, error } = await supabase.functions.invoke("dotloop-admin", {
      body: { action: "disconnect" },
    });

    if (error || data?.error) {
      toast({
        title: "Disconnect failed",
        description: error?.message ?? data?.error ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Dotloop disconnected" });
    void loadStatus();
  };

  const refreshToken = async () => {
    const { data, error } = await supabase.functions.invoke("dotloop-admin", {
      body: { action: "refresh" },
    });

    if (error || data?.error) {
      toast({
        title: "Refresh failed",
        description: error?.message ?? data?.error ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Token refresh successful" });
    void loadStatus();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Integrations</h1>
        <p className="text-muted-foreground">
          Dotloop is managed as a single business-owned admin integration. No per-user Dotloop connections are supported.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dotloop (Company Account)</CardTitle>
          <CardDescription>
            OAuth and tokens are handled server-side only. Secrets and long-lived tokens are never sent to browser code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading status...</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 items-center">
                <Badge variant={status.connected ? "default" : "secondary"}>
                  {status.connected ? "Connected" : "Not Connected"}
                </Badge>
                {status.health_status && <Badge variant="outline">Health: {status.health_status}</Badge>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="text-muted-foreground">Account:</span> {status.account_label ?? "—"}</p>
                <p><span className="text-muted-foreground">Connected At:</span> {status.connected_at ? new Date(status.connected_at).toLocaleString() : "—"}</p>
                <p><span className="text-muted-foreground">Last Sync:</span> {status.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : "—"}</p>
                <p><span className="text-muted-foreground">Token Expires:</span> {status.access_token_expires_at ? new Date(status.access_token_expires_at).toLocaleString() : "—"}</p>
              </div>

              {status.error_metadata && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
                  {JSON.stringify(status.error_metadata)}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!status.connected ? (
                  <Button onClick={() => void startConnect()}>Connect Dotloop</Button>
                ) : (
                  <>
                    <Button onClick={() => void startConnect()}>Reconnect Dotloop</Button>
                    <Button variant="outline" onClick={() => void refreshToken()}>Refresh Token</Button>
                    <Button variant="destructive" onClick={() => void disconnect()}>Disconnect</Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => void loadStatus()}>Refresh Status</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIntegrations;
