/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Backtest: take homes that recently SOLD in renovated condition, value each
// as of its own contract date (so only earlier sales can be comps, and the
// home itself is excluded), and compare the ARV with what it actually sold for.
//
//   node scripts/arv-clean-room/backtest.ts [perArea=8] [key=value engine options]
//   env: REPLIERS_API_KEY (required), AREAS="South|Charles" (substring filter), QUIET=1
import { RepliersClient, estimateArv } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
import { assessCondition, normalizeSold } from "../../supabase/functions/_shared/arv-clean-room/engine.ts";

const AREAS: Record<string, [number, number]> = {
  "South City (Bevo/Dutchtown)": [38.582, -90.260],
  "Tower Grove South": [38.598, -90.258],
  "North County (Florissant)": [38.789, -90.322],
  "Ferguson/Jennings": [38.735, -90.290],
  "University City": [38.666, -90.330],
  "Affton/Lemay": [38.550, -90.320],
  "St. Charles": [38.780, -90.510],
  "Overland/St. Ann": [38.710, -90.370],
};

const perArea = Number(process.argv[2] ?? 8);
const opts: Record<string, number> = {};
for (const a of process.argv.slice(3)) {
  const [k, v] = a.split("=");
  opts[k] = Number(v);
}
const only = process.env.AREAS?.split("|");

const client = new RepliersClient({ apiKey: process.env.REPLIERS_API_KEY ?? "" });
const since = new Date(Date.now() - 120 * 86_400_000).toISOString().slice(0, 10);
const rows: any[] = [];

for (const [area, [lat, lng]] of Object.entries(AREAS)) {
  if (only && !only.some((o) => area.includes(o))) continue;
  const page = await client.searchSold({
    lat, lng, radiusKm: 2.5, minSoldDate: since,
    style: "Single Family Residence", propertyType: "Residential",
  });
  const subjects = page.listings.map(normalizeSold)
    .filter((c) => c && c.sqft && assessCondition(c).tier === "renovated")
    .slice(0, perArea);
  for (const s of subjects) {
    const r = await estimateArv(client, { overrides: s! }, { ...opts, asOf: s!.contractDate + "T00:00:00Z" });
    const actual = s!.soldPrice - s!.concessions;
    rows.push({
      area, mls: s!.mlsNumber, address: s!.address, actual, arv: r.arv, method: r.method,
      err: r.arv ? r.arv / actual - 1 : null, conf: r.confidence, n: r.selectedComps.length,
      labeled: /updated|remodel/i.test(s!.propertyCondition ?? ""),
    });
  }
}

const pct = (x: number) => (x * 100).toFixed(1) + "%";
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : NaN;
};
function summarize(label: string, rs: any[]) {
  const ok = rs.filter((r) => r.err !== null);
  if (!rs.length || !ok.length) return;
  const abs = ok.map((r) => Math.abs(r.err));
  console.log(
    `${label}: n=${rs.length} valued=${ok.length} | median abs err ${pct(med(abs))} | median signed ${pct(med(ok.map((r) => r.err)))}` +
      ` | within 10%: ${pct(abs.filter((a) => a <= 0.1).length / ok.length)} | within 20%: ${pct(abs.filter((a) => a <= 0.2).length / ok.length)}`,
  );
}

if (!process.env.QUIET) {
  console.log("| Area | MLS# | Address | Actual net sale | ARV | Error | Method | Comps | Conf |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(
      `| ${r.area} | ${r.mls} | ${r.address} | $${r.actual.toLocaleString("en-US")} | ${r.arv ? "$" + r.arv.toLocaleString("en-US") : "n/a"} | ${r.err === null ? "n/a" : pct(r.err)} | ${r.method} | ${r.n} | ${r.conf} |`,
    );
  }
  console.log();
}
summarize("ALL", rows);
summarize("method = renovated-comps", rows.filter((r) => r.method === "renovated-comps"));
summarize("method = upper-quantile-fallback", rows.filter((r) => r.method === "upper-quantile-fallback"));
summarize("confidence >= 60", rows.filter((r) => r.conf >= 60));
summarize("confidence < 60", rows.filter((r) => r.conf < 60));
summarize("subjects MLS-labelled Updated/Remodeled", rows.filter((r) => r.labeled));
for (const a of Object.keys(AREAS)) summarize("  " + a, rows.filter((r) => r.area === a));
console.log(`API calls: ${client.calls} for ${rows.length} valuations`);
