import { useCallback, useEffect, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getSoldSchedulePlan } from "../../../supabase/functions/_shared/email-schedules";

type EmailSchedule = Database["public"]["Tables"]["client_email_schedules"]["Row"];

const reportDetails = (schedule: EmailSchedule) => {
  if (schedule.source_type !== "sold_report") return schedule.source_type.replace(/_/g, " ");
  try {
    const plan = getSoldSchedulePlan(schedule, new Date());
    return `${plan.county} · Last ${plan.lookbackDays} days`;
  } catch {
    return "Invalid sold report configuration";
  }
};

const AdminEmailSchedules = () => {
  const [schedules, setSchedules] = useState<EmailSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded: EmailSchedule[] = [];
      let cursor: string | null = null;
      while (true) {
        let query = supabase.from("client_email_schedules").select("*").order("id").limit(500);
        if (cursor) query = query.gt("id", cursor);
        const { data, error: loadError } = await query;
        if (loadError) throw new Error(loadError.message);
        const page = data ?? [];
        loaded.push(...page);
        if (page.length < 500) break;
        cursor = page[page.length - 1].id;
      }
      setSchedules(loaded.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email schedules could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  const toggleSchedule = async (schedule: EmailSchedule) => {
    setProcessingId(schedule.id);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from("client_email_schedules")
        .update({ is_active: !schedule.is_active })
        .eq("id", schedule.id)
        .eq("is_active", schedule.is_active)
        .select("id, is_active")
        .single();
      if (updateError) throw new Error(updateError.message);
      if (!data) throw new Error("This schedule changed. Reload the page and try again.");
      setSchedules((previous) => previous.map((item) => item.id === data.id ? { ...item, is_active: data.is_active } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The schedule could not be updated.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-foreground">Email Schedules</h1>
        <p className="text-muted-foreground">Review scheduled client reports and pause or resume delivery.</p>
      </div>

      {error && <p role="alert" className="rounded-md border border-destructive p-4 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader><CardTitle className="text-lg">Client schedules</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="flex items-center justify-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading schedules…</p>
          ) : schedules.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">{error ? "Schedules are unavailable. Please reload the page to try again." : "No email schedules have been configured."}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell><p className="font-medium">{schedule.client_name}</p><p className="text-sm text-muted-foreground">{schedule.client_email}</p></TableCell>
                      <TableCell>{schedule.source_type === "sold_report" && <p className="font-medium">Sold listings</p>}<p className="text-sm text-muted-foreground">{reportDetails(schedule)}</p></TableCell>
                      <TableCell className="capitalize">{schedule.cadence}</TableCell>
                      <TableCell><span className="capitalize">{schedule.send_mode}</span> · {schedule.file_format.toUpperCase()}</TableCell>
                      <TableCell><Badge variant={schedule.is_active ? "default" : "secondary"}>{schedule.is_active ? "Active" : "Paused"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" disabled={processingId !== null} onClick={() => toggleSchedule(schedule)} aria-label={`${schedule.is_active ? "Pause" : "Resume"} schedule for ${schedule.client_name}`}>
                          {processingId === schedule.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : schedule.is_active ? <Pause className="mr-2 h-3 w-3" /> : <Play className="mr-2 h-3 w-3" />}
                          {schedule.is_active ? "Pause" : "Resume"}
                        </Button>
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

export default AdminEmailSchedules;
