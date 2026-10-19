import {
  getSoldReportCounty,
  getSoldReportWindow,
  type SoldRow,
} from "./sold-report.ts";

export type EmailSchedule = {
  id: string;
  client_name: string;
  client_email: string;
  source_type: string;
  config: unknown;
  cadence: string;
  send_mode: string;
  file_format: string;
  is_active: boolean;
  created_at: string;
};

export type ScheduleSend = {
  status: string;
  detail: unknown;
};

export type ScheduleRunResult = {
  status: "sent" | "no_new_matches" | "ready_email_not_configured" | "skipped_paused" | "failed";
  rowCount: number;
  detail: Record<string, unknown>;
};

export type SoldSchedulePlan = {
  county: string;
  lookbackDays: number;
  fromDate: string;
  toDate: string;
  format: "xlsx" | "csv";
};

export type ScheduleAttachment = {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
};

export type ScheduleDependencies = {
  now: Date;
  emailConfigured: boolean;
  claim: (schedule: EmailSchedule, bucket: string, plan: SoldSchedulePlan | null) => Promise<string | null>;
  successfulSends: (scheduleId: string, fromDate: string) => Promise<ScheduleSend[]>;
  fetchRows: (plan: SoldSchedulePlan) => Promise<SoldRow[]>;
  buildFile: (rows: SoldRow[], plan: SoldSchedulePlan) => ScheduleAttachment;
  isStillActive: (scheduleId: string) => Promise<boolean>;
  deliver: (schedule: EmailSchedule, plan: SoldSchedulePlan, attachment: ScheduleAttachment, idempotencyKey: string) => Promise<string>;
  finish: (sendId: string, result: ScheduleRunResult) => Promise<void>;
};

/** UTC calendar buckets. Weekly schedules begin Monday; a new schedule runs on its first wake. */
export function getScheduleCadenceBucket(cadence: string, now: Date): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (cadence === "monthly") return `monthly:${date.toISOString().slice(0, 7)}`;
  if (cadence === "weekly") {
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return `weekly:${date.toISOString().slice(0, 10)}`;
  }
  if (cadence === "daily") return `daily:${date.toISOString().slice(0, 10)}`;
  throw new Error("Unsupported schedule cadence");
}

export function getSoldSchedulePlan(schedule: EmailSchedule, now: Date): SoldSchedulePlan {
  // Source dispatch belongs in the runner; the database shapes also support future report types.
  if (schedule.source_type !== "sold_report") throw new Error("Unsupported schedule source type");
  if (!schedule.config || typeof schedule.config !== "object" || Array.isArray(schedule.config)) {
    throw new Error("Invalid schedule configuration");
  }
  const config = schedule.config as Record<string, unknown>;
  const county = typeof config.county === "string" ? getSoldReportCounty(config.county) : undefined;
  if (!county) throw new Error("Invalid schedule county");
  const days = config.lookbackDays;
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > 366) {
    throw new Error("Schedule lookbackDays must be an integer from 1 to 366");
  }
  if (schedule.file_format !== "xlsx" && schedule.file_format !== "csv") {
    throw new Error("Unsupported schedule file format");
  }
  return {
    county: county.name,
    lookbackDays: days,
    ...getSoldReportWindow(days, now),
    format: schedule.file_format,
  };
}

export function getNewSoldRows(rows: SoldRow[], history: ScheduleSend[]): SoldRow[] {
  const seen = new Set<string>();
  for (const send of history) {
    if (send.status !== "sent" || !send.detail || typeof send.detail !== "object") continue;
    const ids = (send.detail as Record<string, unknown>).mlsNumbers;
    if (Array.isArray(ids)) {
      for (const id of ids) if (typeof id === "string") seen.add(id);
    }
  }
  return rows.filter((row) => {
    if (seen.has(row.mlsNumber)) return false;
    seen.add(row.mlsNumber);
    return true;
  });
}

export function soldScheduleCoverNote(schedule: EmailSchedule, plan: SoldSchedulePlan): string {
  return `Hi ${schedule.client_name},\n\nAttached is the list of homes sold in ${plan.county} over the last ${plan.lookbackDays} days, with address and date sold.\n\nLet me know if you'd like me to adjust the list.\n\nJen Bahr\nIntegrity Realty STL\n636-789-1430`;
}

/**
 * A unique database claim makes every cadence bucket at most one attempt, including dry runs,
 * failures and interrupted runs. We deliberately do not retry uncertain email delivery automatically.
 */
export async function processEmailSchedule(schedule: EmailSchedule, deps: ScheduleDependencies): Promise<ScheduleRunResult | null> {
  if (!schedule.is_active || schedule.send_mode !== "automatic") return null;
  const bucket = getScheduleCadenceBucket(schedule.cadence, deps.now);
  let plan: SoldSchedulePlan | null = null;
  let validationError: string | null = null;
  try {
    plan = getSoldSchedulePlan(schedule, deps.now);
  } catch (error) {
    validationError = error instanceof Error ? error.message : "Invalid schedule";
  }
  const sendId = await deps.claim(schedule, bucket, plan);
  if (!sendId) return null;

  let result: ScheduleRunResult;
  try {
    if (!plan || validationError) throw new Error(validationError ?? "Invalid schedule");
    const rows = await deps.fetchRows(plan);
    const history = await deps.successfulSends(schedule.id, plan.fromDate);
    const newRows = getNewSoldRows(rows, history);
    const detail = { cadenceBucket: bucket, sourceType: schedule.source_type };
    if (!newRows.length) {
      result = { status: "no_new_matches", rowCount: 0, detail };
    } else {
      const attachment = deps.buildFile(newRows, plan);
      if (!(await deps.isStillActive(schedule.id))) {
        result = { status: "skipped_paused", rowCount: newRows.length, detail };
      } else if (!deps.emailConfigured) {
        result = {
          status: "ready_email_not_configured",
          rowCount: newRows.length,
          detail: { ...detail, filename: attachment.filename },
        };
      } else {
        const providerId = await deps.deliver(schedule, plan, attachment, `schedule-${schedule.id}-${bucket}`);
        result = {
          status: "sent",
          rowCount: newRows.length,
          detail: { ...detail, filename: attachment.filename, providerId, mlsNumbers: newRows.map((row) => row.mlsNumber) },
        };
      }
    }
  } catch (error) {
    // Dependencies return sanitized errors; provider response bodies and credentials are never logged.
    result = {
      status: "failed",
      rowCount: 0,
      detail: { cadenceBucket: bucket, error: error instanceof Error ? error.message : "Schedule processing failed" },
    };
  }
  // A failed database write must reject the invocation, especially after provider acceptance.
  await deps.finish(sendId, result);
  return result;
}
