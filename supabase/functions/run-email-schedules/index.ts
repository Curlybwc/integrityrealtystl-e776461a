import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { zipSync } from "npm:fflate@0.8.2";
import {
  processEmailSchedule,
  soldScheduleCoverNote,
  type EmailSchedule,
  type ScheduleSend,
} from "../_shared/email-schedules.ts";
import { fetchSoldListings } from "../_shared/repliers-sold.ts";
import { buildSoldExport } from "../_shared/sold-export.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json({ error: "Server configuration missing" }, 500);
  const svc = createClient(supabaseUrl, serviceRole);
  // Internal worker, matching process-repair-queue. Browser/admin JWTs cannot trigger emails.
  if (req.headers.get("Authorization") !== `Bearer ${serviceRole}`) {
    // Lovable Cloud never exposes the service_role key; this Vault-only token can only wake this runner.
    const { data: cronWakeToken, error } = await svc.rpc("get_cron_wake_token");
    if (error || typeof cronWakeToken !== "string" || !cronWakeToken ||
      req.headers.get("Authorization") !== "Bearer " + cronWakeToken) {
      return json({ error: "Forbidden" }, 403);
    }
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const repliersKey = Deno.env.get("REPLIERS_API_KEY");
  const now = new Date();
  const counts: Record<string, number> = {};
  let skipped = 0;
  let lastId: string | null = null;
  let logWriteFailed = false;

  try {
    // Seek pagination avoids Supabase's default row limit for schedule lists and send history.
    while (true) {
      let query = svc.from("client_email_schedules").select("*")
        .eq("is_active", true).eq("send_mode", "automatic").order("id").limit(500);
      if (lastId) query = query.gt("id", lastId);
      const { data, error } = await query;
      if (error) throw new Error("Unable to load email schedules");
      const schedules = (data ?? []) as EmailSchedule[];
      if (!schedules.length) break;

      for (const schedule of schedules) {
        try {
          const result = await processEmailSchedule(schedule, {
            now,
            emailConfigured: Boolean(resendKey),
            latestSuccessfulPeriodTo: async (scheduleId) => {
              const { data: latest, error: latestError } = await svc.from("client_email_schedule_sends")
                .select("period_to").eq("schedule_id", scheduleId).eq("status", "sent")
                .not("period_to", "is", null).order("period_to", { ascending: false }).limit(1).maybeSingle();
              if (latestError) throw new Error("Unable to load successful report coverage");
              return latest?.period_to ?? null;
            },
            claim: async (current, bucket, plan) => {
              const { data: send, error: claimError } = await svc.from("client_email_schedule_sends")
                .insert({
                  schedule_id: current.id,
                  period_from: plan?.fromDate ?? null,
                  period_to: plan?.toDate ?? null,
                  status: "processing",
                  row_count: 0,
                  detail: { cadenceBucket: bucket, sourceType: current.source_type },
                }).select("id").single();
              if (claimError?.code === "23505") return null;
              if (claimError || !send) throw new Error("Unable to claim schedule execution");
              return send.id as string;
            },
            successfulSends: async (scheduleId, fromDate) => {
              const history: ScheduleSend[] = [];
              let cursor: string | null = null;
              while (true) {
                let historyQuery = svc.from("client_email_schedule_sends")
                  .select("id,status,detail").eq("schedule_id", scheduleId).eq("status", "sent")
                  .gte("period_to", fromDate).order("id").limit(500);
                if (cursor) historyQuery = historyQuery.gt("id", cursor);
                const { data: page, error: historyError } = await historyQuery;
                if (historyError) throw new Error("Unable to load successful send history");
                if (!page?.length) break;
                history.push(...page);
                cursor = page[page.length - 1].id;
                if (page.length < 500) break;
              }
              return history;
            },
            fetchRows: async (plan) => {
              if (!repliersKey) throw new Error("MLS provider is not configured");
              try {
                return await fetchSoldListings({ county: plan.county, fromDate: plan.fromDate, toDate: plan.toDate }, repliersKey);
              } catch {
                throw new Error("Unable to fetch sold listings");
              }
            },
            buildFile: (rows, plan) => buildSoldExport(rows, plan.county, plan.fromDate, plan.toDate, plan.format, zipSync),
            isStillActive: async (scheduleId) => {
              const { data: current, error: activeError } = await svc.from("client_email_schedules")
                .select("is_active,send_mode").eq("id", scheduleId).single();
              if (activeError) throw new Error("Unable to verify schedule state");
              return Boolean(current?.is_active && current.send_mode === "automatic");
            },
            deliver: async (current, plan, attachment, idempotencyKey) => {
              let response: Response;
              try {
                response = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "Content-Type": "application/json",
                    "Idempotency-Key": idempotencyKey,
                  },
                  body: JSON.stringify({
                    from: "Jen Bahr <jen@integrityrealtystl.com>",
                    to: [current.client_email],
                    subject: `Homes sold in ${plan.county} — ${plan.fromDate} to ${plan.toDate}`,
                    text: soldScheduleCoverNote(current, plan),
                    attachments: [{
                      filename: attachment.filename,
                      content: base64(attachment.bytes),
                      content_type: attachment.contentType,
                    }],
                  }),
                  signal: AbortSignal.timeout(30000),
                });
              } catch {
                throw new Error("Email delivery could not be confirmed");
              }
              if (!response.ok) throw new Error(`Email provider rejected delivery (HTTP ${response.status})`);
              const accepted = await response.json().catch(() => null);
              if (!accepted || typeof accepted.id !== "string") throw new Error("Email delivery could not be confirmed");
              return accepted.id;
            },
            finish: async (sendId, result) => {
              const { data: updated, error: finishError } = await svc.from("client_email_schedule_sends")
                .update({
                  sent_at: new Date().toISOString(),
                  row_count: result.rowCount,
                  status: result.status,
                  detail: result.detail,
                }).eq("id", sendId).eq("status", "processing").select("id").single();
              if (finishError || !updated) throw new Error("Unable to record schedule outcome");
            },
            // No Resend key: build/log a preview without the cadenceBucket claim
            // key so configuring email later in this same bucket remains eligible.
            recordUnclaimed: async (current, plan, result) => {
              const { error: previewError } = await svc.from("client_email_schedule_sends")
                .insert({
                  schedule_id: current.id,
                  period_from: plan?.fromDate ?? null,
                  period_to: plan?.toDate ?? null,
                  row_count: result.rowCount,
                  status: result.status,
                  detail: result.detail,
                });
              if (previewError) throw new Error("Unable to record unconfigured schedule preview");
            },
          });
          if (result) counts[result.status] = (counts[result.status] ?? 0) + 1;
          else skipped++;
        } catch {
          // If outcome recording failed, conservatively preserve the processing claim.
          logWriteFailed = true;
          console.error("Email schedule execution or outcome recording failed", schedule.id);
        }
      }

      lastId = schedules[schedules.length - 1].id;
      if (schedules.length < 500) break;
    }
    return json({ outcomes: counts, skipped, ...(logWriteFailed ? { error: "One or more schedule outcomes could not be recorded" } : {}) }, logWriteFailed ? 500 : 200);
  } catch {
    console.error("Email schedule runner failed");
    return json({ error: "Unable to process email schedules", outcomes: counts, skipped }, 500);
  }
});
