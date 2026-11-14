/* eslint-disable @typescript-eslint/no-explicit-any -- Repliers/MLS payloads are untyped JSON */
// Backtest, v1 vs v2 on identical subjects. Subject selection is UNCHANGED from
// v1: homes that sold in the last 120 days and that v1's own condition
// classifier calls "renovated" (this is circular — see README). Each is valued
// as of its own contract date with itself excluded, and compared with what it
// actually sold for. Only the estimator differs between the two columns.
//
//   node scripts/arv-clean-room/backtest.ts [perArea=12] [key=value v2 options]
//   env: REPLIERS_API_KEY (required), AREAS="South|Charles" (substring filter), QUIET=1
import { estimateArv, estimateArvV2, RepliersClient } from "../../supabase/functions/_shared/arv-clean-room/index.ts";
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

const perArea = Number(process.argv[2] ?? 12);
const opts: Record<string, number | boolean> = {};
for (const a of process.argv.slice(3)) {
  const [k, v] = a.split("=");
  opts[k] = v === "true" ? true : v === "false" ? false : Number(v);
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
    const asOf = s!.contractDate + "T00:00:00Z";
    const v1 = await estimateArv(client, { overrides: s! }, { asOf });
    const v2 = await estimateArvV2(client, { overrides: s! }, { ...opts, asOf });
    const net = s!.soldPrice - s!.concessions; // v1's target, kept for comparability
    rows.push({
      area, mls: s!.mlsNumber, address: s!.address, net, gross: s!.soldPrice,
      v1: v1.arv, v2: v2.value, support: v2.supportCount, stepDown: v2.stepDown?.value ?? null,
      loan: v2.loanBasis.value, ceiling: v2.observedCeiling, step: v2.stepUsed?.label ?? "none",
      why: v2.noValueReason,
    });
  }
}

const pct = (x: number) => (x * 100).toFixed(1) + "%";
const usd = (n: number | null) => (n === null ? "none" : "$" + Math.round(n).toLocaleString("en-US"));
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : NaN;
};
/** Error stats of `est` against `target` over rows where est is present. */
function stats(label: string, rs: any[], est: string, target = "net") {
  const ok = rs.filter((r) => r[est] !== null);
  if (!ok.length) return console.log(`${label}: n=${rs.length}, none valued`);
  const e = ok.map((r) => r[est] / r[target] - 1);
  const abs = e.map(Math.abs);
  console.log(
    `${label}: valued ${ok.length}/${rs.length} | median abs err ${pct(med(abs))} | median signed ${pct(med(e))}` +
      ` | within 10%: ${pct(abs.filter((a) => a <= 0.1).length / ok.length)} | within 20%: ${pct(abs.filter((a) => a <= 0.2).length / ok.length)}` +
      ` | over by >10%: ${pct(e.filter((x) => x > 0.1).length / ok.length)} | under by >10%: ${pct(e.filter((x) => x < -0.1).length / ok.length)}`,
  );
}

if (!process.env.QUIET) {
  console.log("| Area | MLS# | Address | Actual sold (gross) | Net of concessions | v1 ARV | v2 value | Support | v2 step-down | v2 loan basis | v2 err vs net | Ladder step |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.area} | ${r.mls} | ${r.address} | ${usd(r.gross)} | ${usd(r.net)} | ${usd(r.v1)} | ${r.v2 === null ? "no supported value" : usd(r.v2)} | ${r.support} | ${usd(r.stepDown)} | ${usd(r.loan)} | ${r.v2 === null ? "n/a" : pct(r.v2 / r.net - 1)} | ${r.step} |`);
  }
  console.log();
}

const both = rows.filter((r) => r.v2 !== null && r.v1 !== null);
console.log("== Headline (target = actual sale net of concessions, same as v1's backtest) ==");
stats("v1, all subjects", rows, "v1");
stats("v2 value, all subjects", rows, "v2");
stats("v1, only subjects v2 valued", both, "v1");
stats("v2 value, same subjects", both, "v2");
console.log("\n== v2 against the gross sold price (v2 reads gross comp prices) ==");
stats("v2 value vs gross", rows, "v2", "gross");
console.log("\n== v2 loan basis and step-down ==");
stats("v2 loan basis", rows, "loan");
stats("v2 step-down", rows, "stepDown");
console.log("\n== v2 by support count ==");
stats("support = 2", rows.filter((r) => r.support === 2), "v2");
stats("support >= 3", rows.filter((r) => r.support >= 3), "v2");
console.log("\n== v2 by ladder step ==");
for (const st of [...new Set(rows.map((r) => r.step))]) stats(st, rows.filter((r) => r.step === st), "v2");
console.log("\n== v2 coverage and ceiling ==");
const none = rows.filter((r) => r.v2 === null);
console.log(`no supported value: ${none.length}/${rows.length} (${none.filter((r) => /Fewer/.test(r.why ?? "")).length} too few good comps, ${none.filter((r) => /agree/.test(r.why ?? "")).length} no two comps agree)`);
const withCeil = rows.filter((r) => r.ceiling !== null);
console.log(`subject sold above the highest non-outlier comp: ${withCeil.filter((r) => r.gross > r.ceiling).length}/${withCeil.length}; by more than $15K: ${withCeil.filter((r) => r.gross > r.ceiling + 15000).length}/${withCeil.length}`);
console.log("\n== by area (v2 value | v1) ==");
for (const a of Object.keys(AREAS)) {
  const rs = rows.filter((r) => r.area === a);
  if (!rs.length) continue;
  stats(`  ${a} v2`, rs, "v2");
  stats(`  ${a} v1`, rs, "v1");
}
console.log(`\nRepliers requests: ${client.calls} for ${rows.length} subjects x 2 estimators`);
