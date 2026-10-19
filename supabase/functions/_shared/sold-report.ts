export interface SoldRow {
  address: string;
  city: string;
  state: string;
  zip: string;
  soldDate: string;
  mlsNumber: string;
}

// Postal areas approximate counties and can cross county boundaries. Keep this
// single configuration shared by the admin export and scheduled email runner.
export const SOLD_REPORT_COUNTIES = [
  {
    name: "St. Charles County",
    slug: "st-charles-county",
    zips: [
      "63301", "63303", "63304", "63332", "63338", "63341", "63346",
      "63348", "63357", "63366", "63367", "63368", "63373", "63376",
      "63385", "63386",
    ],
  },
  {
    name: "St. Louis County",
    slug: "st-louis-county",
    zips: [
      "63005", "63011", "63017", "63021", "63025", "63026", "63031",
      "63033", "63034", "63038", "63040", "63042", "63043", "63044",
      "63045", "63069", "63074", "63088", "63105", "63114", "63117",
      "63119", "63121", "63122", "63123", "63124", "63125", "63126",
      "63127", "63128", "63129", "63130", "63131", "63132", "63133",
      "63134", "63135", "63136", "63137", "63138", "63140", "63141",
      "63143", "63144", "63146",
    ],
  },
  {
    name: "St. Louis City",
    slug: "st-louis-city",
    zips: [
      "63101", "63102", "63103", "63104", "63106", "63107", "63108",
      "63109", "63110", "63111", "63112", "63113", "63115", "63116",
      "63118", "63120", "63139", "63143", "63147",
    ],
  },
] as const;

export function getSoldReportCounty(name: unknown) {
  const county = SOLD_REPORT_COUNTIES.find((entry) => entry.name === name);
  if (!county) throw new Error("Select a supported county");
  return county;
}

export function isSoldReportDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00.000Z`)) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function validateSoldReportRange(fromDate: unknown, toDate: unknown): void {
  if (!isSoldReportDate(fromDate) || !isSoldReportDate(toDate) || fromDate > toDate) {
    throw new Error("Provide a valid fromDate and toDate in YYYY-MM-DD order");
  }
}

// The last N UTC calendar dates, including today, used consistently in both UIs
// and scheduled reports. Sold dates are calendar dates rather than timestamps.
export function getSoldReportWindow(lookbackDays: number, now = new Date()) {
  if (!Number.isInteger(lookbackDays) || lookbackDays < 1 || lookbackDays > 366 || !Number.isFinite(now.getTime())) {
    throw new Error("lookbackDays must be an integer between 1 and 366");
  }
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - lookbackDays + 1);
  return { fromDate: start.toISOString().slice(0, 10), toDate: end.toISOString().slice(0, 10) };
}
